import {
  ConflictException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  EventResultStatus,
  EventPlacement,
  Prisma,
  RatingEntrySubjectType,
  RatingOutcome,
} from '../generated/prisma-client';
import { RatingsDataService } from './ratings-data.service';
import { PlayerRatingsService } from './player-ratings.service';
import { TeamRatingsService } from './team-ratings.service';
import {
  CompleteEventWithRatingsRequest,
  EventResultRequest,
  EventResultResponse,
} from './interfaces';
import { EventsDataService } from '../events/events-data.service';
import { OrganizerRatingsService } from './organizer-ratings.service';

type EventResultWithRelations = Prisma.EventResultGetPayload<{
  include: {
    event: {
      select: {
        id: true;
        name: true;
        competitionType: true;
      };
    };
    user: {
      select: {
        id: true;
        nickName: true;
        logoUrl: true;
      };
    };
    team: {
      select: {
        id: true;
        name: true;
        logoUrl: true;
      };
    };
  };
}>;

@Injectable()
export class EventResultsService {
  // Очки за место
  private readonly POINTS_BY_PLACEMENT: Record<EventPlacement, number> = {
    [EventPlacement.FIRST]: 100,
    [EventPlacement.SECOND]: 75,
    [EventPlacement.THIRD]: 50,
    [EventPlacement.PARTICIPATED]: 25,
  };

  // Бонусы за статистику
  private readonly KILL_BONUS = 2;
  private readonly ACCURACY_BONUS_MULTIPLIER = 0.5;

  constructor(
    private readonly ratingsDataService: RatingsDataService,
    private readonly playerRatingsService: PlayerRatingsService,
    private readonly teamRatingsService: TeamRatingsService,
    private readonly eventsDataService: EventsDataService,
    private readonly organizerRatingsService: OrganizerRatingsService,
  ) {}

  async getActiveRatingGameTypes() {
    return this.ratingsDataService.getActiveRatingGameTypes();
  }

  async getAllRatingGameTypes() {
    return this.ratingsDataService.getAllRatingGameTypes();
  }

  async createRatingGameType(data: {
    name: string;
    playerPoints: number;
    teamWinPoints: number;
    teamParticipatedPoints: number;
    organizerPointsPerParticipant: number;
    isActive?: boolean;
  }) {
    const existing = (
      await this.ratingsDataService.getAllRatingGameTypes()
    ).find(
      (item) => item.name.toLowerCase() === data.name.trim().toLowerCase(),
    );
    if (existing) {
      throw new ConflictException('RATING_GAME_TYPE_ALREADY_EXISTS');
    }

    return this.ratingsDataService.createRatingGameType(data);
  }

  async createResult(
    userId: number,
    data: EventResultRequest,
  ): Promise<EventResultResponse> {
    // Проверка существования события
    const event = await this.eventsDataService.findById(data.eventId);
    if (!event) {
      throw new NotFoundException('EVENT_NOT_FOUND');
    }

    // Проверка, что событие завершено
    if (!event.isCompleted) {
      throw new BadRequestException('EVENT_NOT_COMPLETED');
    }

    // Проверка типа соревнования
    if (event.competitionType === 'TEAM' && !data.teamId) {
      throw new BadRequestException('TEAM_ID_REQUIRED_FOR_TEAM_EVENT');
    }

    if (event.competitionType === 'INDIVIDUAL' && !data.userId) {
      throw new BadRequestException('USER_ID_REQUIRED_FOR_INDIVIDUAL_EVENT');
    }

    // Проверка на дубликаты
    if (data.userId) {
      const existing =
        await this.ratingsDataService.findEventResultByEventAndUser(
          data.eventId,
          data.userId,
        );
      if (existing) {
        throw new BadRequestException('RESULT_ALREADY_EXISTS_FOR_USER');
      }
    }

    if (data.teamId && data.userId == null) {
      const existing =
        await this.ratingsDataService.findEventResultByEventAndTeam(
          data.eventId,
          data.teamId,
        );
      if (existing) {
        throw new BadRequestException('RESULT_ALREADY_EXISTS_FOR_TEAM');
      }
    }

    // Расчет очков
    const points = this.calculatePoints(data);

    // Создание результата
    const result = await this.ratingsDataService.createEventResult({
      ...data,
      points,
    });

    // Если это результат игрока в командном событии, обновляем результат команды
    if (event.competitionType === 'TEAM' && data.userId && data.teamId) {
      await this.updateTeamResultFromPlayerResults(data.eventId, data.teamId);
    }

    return this.mapToResponse(result);
  }

  async updateResult(
    id: number,
    data: Partial<EventResultRequest>,
  ): Promise<EventResultResponse> {
    const existing = await this.ratingsDataService.findEventResultById(id);
    if (!existing) {
      throw new NotFoundException('RESULT_NOT_FOUND');
    }

    // Пересчет очков, если изменилось место или статистика
    let points = existing.points;
    if (
      data.placement ||
      data.kills !== undefined ||
      data.accuracy !== undefined
    ) {
      const updateData = {
        placement: data.placement || existing.placement,
        kills:
          data.kills !== undefined ? data.kills : (existing.kills ?? undefined),
        accuracy:
          data.accuracy !== undefined
            ? data.accuracy
            : existing.accuracy?.toNumber(),
      };
      points = this.calculatePoints(updateData);
    }

    const updated = await this.ratingsDataService.updateEventResult(id, {
      ...data,
      points,
    });

    // Если это результат игрока в командном событии, обновляем результат команды
    if (
      updated.event?.competitionType === 'TEAM' &&
      updated.userId &&
      updated.teamId
    ) {
      await this.updateTeamResultFromPlayerResults(
        updated.eventId,
        updated.teamId,
      );
    }

    return this.mapToResponse(updated);
  }

  async confirmResult(
    id: number,
    confirmedBy: number,
  ): Promise<EventResultResponse> {
    const result = await this.ratingsDataService.findEventResultById(id);
    if (!result) {
      throw new NotFoundException('RESULT_NOT_FOUND');
    }

    if (result.status === EventResultStatus.CONFIRMED) {
      throw new BadRequestException('RESULT_ALREADY_CONFIRMED');
    }

    // Обновление статуса
    const updated = await this.ratingsDataService.updateEventResult(id, {
      status: EventResultStatus.CONFIRMED,
      confirmedBy,
    });

    // Обновление рейтингов
    await this.updateRatingsFromResult(updated);

    return this.mapToResponse(updated);
  }

  async getEventResults(eventId: number): Promise<EventResultResponse[]> {
    const [results, registrations, event, outcomes, ratingConfig] = await Promise.all([
      this.ratingsDataService.findEventResultsByEventId(eventId),
      this.ratingsDataService.getApprovedRegistrationsWithDetails(eventId),
      this.eventsDataService.findById(eventId),
      this.ratingsDataService.getEventRatingOutcomes(eventId),
      this.ratingsDataService.getEventRatingConfig(eventId),
    ]);

    const sideById = new Map(
      (event.sides ?? []).map((side) => [side.id, { id: side.id, name: side.name }]),
    );
    const sideIdByUserId = new Map(
      registrations
        .filter((registration) => registration.eventSideId != null)
        .map((registration) => [registration.userId, registration.eventSideId as number]),
    );
    const sideByTeamId = new Map(
      (event.sides ?? [])
        .filter((side) => side.teamId != null)
        .map((side) => [side.teamId as number, { id: side.id, name: side.name }]),
    );
    const outcomeByTeamId = new Map(
      outcomes
        .filter((outcome) => outcome.teamId != null)
        .map((outcome) => [outcome.teamId as number, outcome.outcome]),
    );
    const outcomeBySideId = new Map(
      outcomes
        .filter((outcome) => outcome.sideId != null)
        .map((outcome) => [outcome.sideId as number, outcome.outcome]),
    );

    const resolveOutcome = (
      teamId?: number,
      sideId?: number,
    ): RatingOutcome | undefined => {
      if (teamId && outcomeByTeamId.has(teamId)) {
        return outcomeByTeamId.get(teamId);
      }
      if (sideId && outcomeBySideId.has(sideId)) {
        return outcomeBySideId.get(sideId);
      }
      return undefined;
    };

    if (
      results.length === 0 &&
      ratingConfig?.isApplied &&
      registrations.length > 0
    ) {
      const now = new Date();
      let syntheticId = -1;
      const isTeamEvent = event.competitionType === 'TEAM';

      const virtualResults: EventResultResponse[] = [];

      if (isTeamEvent) {
        const teamIds = Array.from(
          new Set([
            ...registrations
              .map((registration) => registration.teamId)
              .filter((teamId): teamId is number => teamId != null),
            ...(event.sides ?? [])
              .map((side) => side.teamId)
              .filter((teamId): teamId is number => teamId != null),
          ]),
        );

        teamIds.forEach((teamId) => {
          const sideId = sideByTeamId.get(teamId)?.id;
          const outcome = resolveOutcome(teamId, sideId) ?? RatingOutcome.PARTICIPATED;
          const points =
            outcome === RatingOutcome.WIN
              ? ratingConfig.gameType.teamWinPoints
              : ratingConfig.gameType.teamParticipatedPoints;
          const teamFromRegistration = registrations.find(
            (registration) => registration.team?.id === teamId,
          )?.team;

          virtualResults.push({
            id: syntheticId--,
            eventId,
            teamId,
            sideId,
            outcome,
            placement: EventPlacement.PARTICIPATED,
            points,
            status: EventResultStatus.CONFIRMED,
            createdAt: now,
            updatedAt: now,
            event: {
              id: event.id,
              name: event.name,
              competitionType: event.competitionType,
            },
            team: teamFromRegistration
              ? {
                  id: teamFromRegistration.id,
                  name: teamFromRegistration.name,
                  logoUrl: teamFromRegistration.logoUrl ?? undefined,
                }
              : undefined,
            side: sideId ? sideById.get(sideId) : undefined,
          });
        });
      }

      registrations.forEach((registration) => {
        const sideId =
          registration.eventSideId ??
          (registration.teamId ? sideByTeamId.get(registration.teamId)?.id : undefined);
        const outcome =
          resolveOutcome(registration.teamId ?? undefined, sideId) ??
          RatingOutcome.PARTICIPATED;

        virtualResults.push({
          id: syntheticId--,
          eventId,
          userId: registration.userId,
          teamId: registration.teamId ?? undefined,
          sideId,
          outcome,
          placement: EventPlacement.PARTICIPATED,
          points: ratingConfig.gameType.playerPoints,
          status: EventResultStatus.CONFIRMED,
          createdAt: now,
          updatedAt: now,
          event: {
            id: event.id,
            name: event.name,
            competitionType: event.competitionType,
          },
          user: {
            id: registration.user.id,
            nickName: registration.user.nickName,
            logoUrl: registration.user.logoUrl ?? undefined,
          },
          team: registration.team
            ? {
                id: registration.team.id,
                name: registration.team.name,
                logoUrl: registration.team.logoUrl ?? undefined,
              }
            : undefined,
          side: sideId ? sideById.get(sideId) : undefined,
        });
      });

      return virtualResults;
    }

    return results.map((result) => {
      let sideId: number | undefined;
      let outcome: RatingOutcome | undefined;

      if (result.teamId && sideByTeamId.has(result.teamId)) {
        sideId = sideByTeamId.get(result.teamId)?.id;
      } else if (result.userId && sideIdByUserId.has(result.userId)) {
        sideId = sideIdByUserId.get(result.userId);
      }

      outcome = resolveOutcome(result.teamId ?? undefined, sideId);

      return this.mapToResponse(
        result,
        sideId,
        sideId ? sideById.get(sideId) : undefined,
        outcome,
      );
    });
  }

  async getResult(id: number): Promise<EventResultResponse> {
    const result = await this.ratingsDataService.findEventResultById(id);
    if (!result) {
      throw new NotFoundException('RESULT_NOT_FOUND');
    }
    return this.mapToResponse(result);
  }

  async deleteResult(id: number): Promise<void> {
    const result = await this.ratingsDataService.findEventResultById(id);
    if (!result) {
      throw new NotFoundException('RESULT_NOT_FOUND');
    }

    const event = await this.eventsDataService.findById(result.eventId);
    const wasTeamEvent = event?.competitionType === 'TEAM';
    const teamId = result.teamId;

    // Если результат был подтвержден, нужно откатить рейтинги
    if (result.status === EventResultStatus.CONFIRMED) {
      await this.rollbackRatingsFromResult(result);
    }

    await this.ratingsDataService.deleteEventResult(id);

    // Если это был результат игрока в командном событии, обновляем результат команды
    if (wasTeamEvent && result.userId && teamId) {
      await this.updateTeamResultFromPlayerResults(result.eventId, teamId);
    }
  }

  async completeEventWithRatings(
    eventId: number,
    _completedBy: number,
    payload: CompleteEventWithRatingsRequest,
  ): Promise<{
    eventId: number;
    gameTypeId: number;
    actualParticipants: number;
    playerAwards: number;
    teamAwards: number;
    organizerPoints: number;
  }> {
    const event =
      await this.ratingsDataService.getEventForRatingCompletion(eventId);
    if (!event) {
      throw new NotFoundException('EVENT_NOT_FOUND');
    }

    const alreadyApplied =
      await this.ratingsDataService.hasAppliedRatingConfig(eventId);
    if (alreadyApplied) {
      throw new BadRequestException('RATING_ALREADY_APPLIED_FOR_EVENT');
    }

    const gameType = await this.ratingsDataService.getRatingGameTypeById(
      event.ratingGameTypeId,
    );
    if (!gameType || !gameType.isActive) {
      throw new BadRequestException('RATING_GAME_TYPE_NOT_FOUND');
    }

    const registrations =
      await this.ratingsDataService.getApprovedRegistrations(eventId);
    if (registrations.length === 0) {
      throw new BadRequestException('NO_APPROVED_PARTICIPANTS');
    }

    if (!event.isCompleted) {
      await this.eventsDataService.completeEvent(eventId);
    }

    const outcomeBySide = new Map<number, RatingOutcome>();
    const outcomeByTeam = new Map<number, RatingOutcome>();

    for (const outcome of payload.outcomes) {
      if (!outcome.sideId && !outcome.teamId) {
        throw new BadRequestException('OUTCOME_MUST_HAVE_SIDE_OR_TEAM');
      }

      if (outcome.sideId) {
        outcomeBySide.set(outcome.sideId, outcome.outcome as RatingOutcome);
      }
      if (outcome.teamId) {
        outcomeByTeam.set(outcome.teamId, outcome.outcome as RatingOutcome);
      }
    }

    const playerPoints = gameType.playerPoints;
    const ratingEntries: Array<{
      eventId: number;
      subjectType: RatingEntrySubjectType;
      userId?: number;
      teamId?: number;
      organizerUserId?: number;
      points: number;
      gamesDelta?: number;
      winsDelta?: number;
    }> = [];

    const isTeamEvent = event.competitionType === 'TEAM';
    const uniqueUserIds = Array.from(
      new Set(registrations.map((r) => r.userId)),
    );

    for (const userId of uniqueUserIds) {
      const registration = registrations.find((r) => r.userId === userId);
      if (!registration) {
        continue;
      }

      let outcome: RatingOutcome = RatingOutcome.PARTICIPATED;
      if (registration.teamId && outcomeByTeam.has(registration.teamId)) {
        outcome = outcomeByTeam.get(registration.teamId)!;
      } else if (
        registration.eventSideId &&
        outcomeBySide.has(registration.eventSideId)
      ) {
        outcome = outcomeBySide.get(registration.eventSideId)!;
      }

      await this.playerRatingsService.applyManualGameResult(
        userId,
        playerPoints,
        outcome === RatingOutcome.WIN,
      );

      ratingEntries.push({
        eventId,
        subjectType: RatingEntrySubjectType.PLAYER,
        userId,
        points: playerPoints,
        gamesDelta: 1,
        winsDelta: outcome === RatingOutcome.WIN ? 1 : 0,
      });
    }

    const teamIds = new Set<number>();
    for (const registration of registrations) {
      if (registration.teamId) {
        teamIds.add(registration.teamId);
      }
    }
    for (const side of event.sides) {
      if (side.teamId) {
        teamIds.add(side.teamId);
      }
    }

    let teamAwards = 0;
    if (isTeamEvent) {
      for (const teamId of teamIds) {
        let outcome: RatingOutcome = RatingOutcome.PARTICIPATED;
        if (outcomeByTeam.has(teamId)) {
          outcome = outcomeByTeam.get(teamId)!;
        } else {
          const matchingSide = event.sides.find(
            (side) => side.teamId === teamId,
          );
          if (matchingSide && outcomeBySide.has(matchingSide.id)) {
            outcome = outcomeBySide.get(matchingSide.id)!;
          }
        }

        const outcomePointsBase =
          outcome === RatingOutcome.WIN
            ? gameType.teamWinPoints
            : gameType.teamParticipatedPoints;
        const teamPoints = outcomePointsBase;
        teamAwards += teamPoints;

        await this.teamRatingsService.applyManualGameResult(
          teamId,
          teamPoints,
          outcome === RatingOutcome.WIN,
        );

        ratingEntries.push({
          eventId,
          subjectType: RatingEntrySubjectType.TEAM,
          teamId,
          points: teamPoints,
          gamesDelta: 1,
          winsDelta: outcome === RatingOutcome.WIN ? 1 : 0,
        });
      }
    }

    const actualParticipants =
      payload.actualParticipants > 0
        ? payload.actualParticipants
        : registrations.length;
    const organizerPoints =
      gameType.organizerPointsPerParticipant * actualParticipants;
    const organizerUserId = event.application.owner.id;

    await this.organizerRatingsService.applyOrganizerDelta(
      organizerUserId,
      organizerPoints,
    );

    ratingEntries.push({
      eventId,
      subjectType: RatingEntrySubjectType.ORGANIZER,
      organizerUserId,
      points: organizerPoints,
      gamesDelta: 1,
      winsDelta: 0,
    });

    await this.ratingsDataService.createEventRatingConfig({
      eventId,
      gameTypeId: gameType.id,
      actualParticipants,
      outcomes: payload.outcomes.map((outcome) => ({
        sideId: outcome.sideId,
        teamId: outcome.teamId,
        outcome: outcome.outcome as RatingOutcome,
      })),
    });
    await this.ratingsDataService.createRatingEntries(ratingEntries);

    return {
      eventId,
      gameTypeId: gameType.id,
      actualParticipants,
      playerAwards: playerPoints * uniqueUserIds.length,
      teamAwards,
      organizerPoints,
    };
  }

  private calculatePoints(
    data:
      | EventResultRequest
      | { placement: EventPlacement; kills?: number; accuracy?: number },
  ): number {
    const placement = data.placement;
    let points = this.POINTS_BY_PLACEMENT[placement] || 0;

    // Бонус за убийства
    if (data.kills) {
      points += data.kills * this.KILL_BONUS;
    }

    // Бонус за точность
    if (data.accuracy) {
      points += Math.round(data.accuracy * this.ACCURACY_BONUS_MULTIPLIER);
    }

    return points;
  }

  private async updateRatingsFromResult(
    result: EventResultWithRelations,
  ): Promise<void> {
    if (result.userId) {
      await this.playerRatingsService.updateStatsFromResult(result);
    }

    if (result.teamId) {
      await this.teamRatingsService.updateStatsFromResult(result);
    }
  }

  private async rollbackRatingsFromResult(
    result: EventResultWithRelations,
  ): Promise<void> {
    if (result.userId) {
      await this.playerRatingsService.rollbackStatsFromResult(result);
    }

    if (result.teamId) {
      await this.teamRatingsService.rollbackStatsFromResult(result);
    }
  }

  /**
   * Автоматически вычисляет и обновляет результат команды на основе результатов игроков
   */
  private async updateTeamResultFromPlayerResults(
    eventId: number,
    teamId: number,
  ): Promise<void> {
    // Получаем все результаты игроков этой команды для этого события
    const allResults =
      await this.ratingsDataService.findEventResultsByEventId(eventId);
    const teamPlayerResults = allResults.filter(
      (r) => r.userId && r.teamId === teamId,
    );

    // Если нет результатов игроков, удаляем результат команды (если есть)
    if (teamPlayerResults.length === 0) {
      const existingTeamResult =
        await this.ratingsDataService.findEventResultByEventAndTeam(
          eventId,
          teamId,
        );
      if (existingTeamResult) {
        // Если результат команды был подтвержден, откатываем рейтинг
        if (existingTeamResult.status === EventResultStatus.CONFIRMED) {
          // Загружаем результат с полными данными для отката
          const fullResult = await this.ratingsDataService.findEventResultById(
            existingTeamResult.id,
          );
          if (fullResult) {
            await this.rollbackRatingsFromResult(fullResult as any);
          }
        }
        await this.ratingsDataService.deleteEventResult(existingTeamResult.id);
      }
      return;
    }

    // Вычисляем суммарные значения
    const totalPoints = teamPlayerResults.reduce((sum, r) => sum + r.points, 0);
    const totalKills = teamPlayerResults.reduce(
      (sum, r) => sum + (r.kills ?? 0),
      0,
    );
    const totalDeaths = teamPlayerResults.reduce(
      (sum, r) => sum + (r.deaths ?? 0),
      0,
    );
    const totalAccuracy = teamPlayerResults.reduce(
      (sum, r) => sum + (r.accuracy?.toNumber() ?? 0),
      0,
    );
    const averageAccuracy =
      teamPlayerResults.length > 0
        ? totalAccuracy / teamPlayerResults.length
        : undefined;

    // Определяем placement команды: лучшее placement среди игроков
    // FIRST > SECOND > THIRD > PARTICIPATED
    let teamPlacement: EventPlacement = EventPlacement.PARTICIPATED;
    const placementPriority: Record<EventPlacement, number> = {
      [EventPlacement.FIRST]: 4,
      [EventPlacement.SECOND]: 3,
      [EventPlacement.THIRD]: 2,
      [EventPlacement.PARTICIPATED]: 1,
    };

    for (const result of teamPlayerResults) {
      if (
        placementPriority[result.placement] > placementPriority[teamPlacement]
      ) {
        teamPlacement = result.placement;
      }
    }

    // Ищем существующий результат команды
    const existingTeamResult =
      await this.ratingsDataService.findEventResultByEventAndTeam(
        eventId,
        teamId,
      );

    const teamResultData: EventResultRequest = {
      eventId,
      teamId,
      placement: teamPlacement,
      points: totalPoints,
      kills: totalKills > 0 ? totalKills : undefined,
      deaths: totalDeaths > 0 ? totalDeaths : undefined,
      accuracy:
        averageAccuracy !== undefined && averageAccuracy > 0
          ? averageAccuracy
          : undefined,
    };

    if (existingTeamResult) {
      // Обновляем существующий результат команды
      const wasConfirmed =
        existingTeamResult.status === EventResultStatus.CONFIRMED;

      // Загружаем полный результат для отката (если нужно)

      let fullExistingResult: any = null;
      if (wasConfirmed) {
        const loadedResult = await this.ratingsDataService.findEventResultById(
          existingTeamResult.id,
        );
        if (loadedResult) {
          fullExistingResult = loadedResult;
        }
      }

      await this.ratingsDataService.updateEventResult(existingTeamResult.id, {
        ...teamResultData,
        // Сохраняем статус подтверждения
        status: wasConfirmed
          ? EventResultStatus.CONFIRMED
          : existingTeamResult.status,
      });

      // Если результат был подтвержден, обновляем рейтинг команды
      if (wasConfirmed && fullExistingResult) {
        const updatedResult = await this.ratingsDataService.findEventResultById(
          existingTeamResult.id,
        );
        if (updatedResult) {
          const updatedWithRelations =
            updatedResult as unknown as EventResultWithRelations;
          // Сначала откатываем старый результат
          await this.rollbackRatingsFromResult(fullExistingResult);
          // Затем применяем новый
          await this.updateRatingsFromResult(updatedWithRelations);
        }
      }
    } else {
      // Создаем новый результат команды
      await this.ratingsDataService.createEventResult(teamResultData);
    }
  }

  private mapToResponse(
    result: EventResultWithRelations,
    sideId?: number,
    side?: { id: number; name: string },
    outcome?: RatingOutcome,
  ): EventResultResponse {
    return {
      id: result.id,
      eventId: result.eventId,
      userId: result.userId ?? undefined,
      teamId: result.teamId ?? undefined,
      sideId,
      outcome,
      placement: result.placement,
      points: result.points,
      kills: result.kills ?? undefined,
      deaths: result.deaths ?? undefined,
      accuracy: result.accuracy?.toNumber(),
      status: result.status,
      confirmedAt: result.confirmedAt ?? undefined,
      confirmedBy: result.confirmedBy ?? undefined,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      event: result.event ?? undefined,
      user: result.user
        ? {
            id: result.user.id,
            nickName: result.user.nickName,
            logoUrl: result.user.logoUrl ?? undefined,
          }
        : undefined,
      team: result.team
        ? {
            id: result.team.id,
            name: result.team.name,
            logoUrl: result.team.logoUrl ?? undefined,
          }
        : undefined,
      side,
    };
  }
}
