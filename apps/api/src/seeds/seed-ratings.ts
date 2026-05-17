import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import {
  EventPlacement,
  EventRegistrationStatus,
  EventResultStatus,
  Prisma,
  PrismaClient,
  TeamMemberStatus,
} from '../generated/prisma-client';
import { DATABASE_URL } from '../utils/config';

const pool = new Pool({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

// Формула расчета очков (та же, что в EventResultsService)
const POINTS_BY_PLACEMENT = {
  [EventPlacement.FIRST]: 100,
  [EventPlacement.SECOND]: 75,
  [EventPlacement.THIRD]: 50,
  [EventPlacement.PARTICIPATED]: 25,
};

const KILL_BONUS = 2;
const ACCURACY_BONUS_MULTIPLIER = 0.5;
const MIN_PLAYERS_FOR_PAGINATION = 33;
const MIN_TEAMS_FOR_PAGINATION = 33;

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calculatePoints(
  placement: EventPlacement,
  kills?: number,
  accuracy?: number,
): number {
  let points = POINTS_BY_PLACEMENT[placement] || 0;

  if (kills) {
    points += kills * KILL_BONUS;
  }

  if (accuracy) {
    points += Math.round(accuracy * ACCURACY_BONUS_MULTIPLIER);
  }

  return points;
}

async function seedRatings() {
  try {
    console.log('🌱 Starting ratings seed...');

    // Получаем id любого существующего пользователя для поля confirmedBy
    const adminUser = await prisma.user.findFirst({
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    const confirmedById = adminUser?.id ?? null;

    // Получаем завершенные события (или создаем несколько завершенных для теста)
    const events = await prisma.event.findMany({
      where: {
        OR: [
          { isCompleted: true },
          {
            startDate: {
              lt: new Date(), // События, которые уже прошли
            },
          },
        ],
      },
      include: {
        registrations: {
          where: {
            status: EventRegistrationStatus.APPROVED,
          },
          include: {
            user: true,
            team: true,
          },
        },
      },
      take: 10, // Берем первые 10 для теста
    });

    if (events.length === 0) {
      console.log(
        '⚠️  No completed events found. Marking some events as completed...',
      );

      // Помечаем несколько событий как завершенные
      const eventsToComplete = await prisma.event.findMany({
        where: {
          startDate: {
            lt: new Date(),
          },
          isCompleted: false,
        },
        take: 5,
      });

      for (const event of eventsToComplete) {
        await prisma.event.update({
          where: { id: event.id },
          data: {
            isCompleted: true,
            completedAt: event.endDate || event.startDate,
          },
        });
      }

      // Повторно получаем события
      const updatedEvents = await prisma.event.findMany({
        where: {
          isCompleted: true,
        },
        include: {
          registrations: {
            where: {
              status: 'APPROVED',
            },
            include: {
              user: true,
              team: true,
            },
          },
        },
        take: 10,
      });

      events.push(...updatedEvents);
    }

    console.log(`📅 Found ${events.length} events to process`);

    // Получаем пользователей и команды для создания регистраций
    const allUsers = await prisma.user.findMany({
      take: 50,
    });

    const allTeams = await prisma.team.findMany({
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
      take: 100,
    });

    console.log(
      `👥 Found ${allUsers.length} users and ${allTeams.length} teams`,
    );

    // Создаем регистрации для событий, если их нет
    let registrationsCreated = 0;
    for (const event of events) {
      if (event.registrations.length === 0) {
        console.log(`📝 Creating registrations for event: ${event.name}`);

        if (event.competitionType === 'TEAM') {
          // Для командных событий регистрируем команды
          const teamsToRegister = allTeams.slice(
            0,
            Math.min(8, allTeams.length),
          );
          for (const team of teamsToRegister) {
            // Берем первого активного участника команды
            const activeMember =
              team.members.find(
                (m) => m.memberStatus === TeamMemberStatus.ACTIVE,
              ) || team.members[0];
            if (!activeMember || !activeMember.user) continue;
            const captain = activeMember.user;

            try {
              await prisma.eventRegistration.upsert({
                where: {
                  eventId_userId: {
                    eventId: event.id,
                    userId: captain.id,
                  },
                },
                create: {
                  eventId: event.id,
                  userId: captain.id,
                  teamId: team.id,
                  status: EventRegistrationStatus.APPROVED,
                },
                update: {
                  status: EventRegistrationStatus.APPROVED,
                },
              });
              registrationsCreated++;
            } catch {
              // Игнорируем ошибки дубликатов
            }
          }
        } else {
          // Для индивидуальных событий регистрируем пользователей
          const usersToRegister = allUsers.slice(
            0,
            Math.min(16, allUsers.length),
          );
          for (const user of usersToRegister) {
            try {
              await prisma.eventRegistration.upsert({
                where: {
                  eventId_userId: {
                    eventId: event.id,
                    userId: user.id,
                  },
                },
                create: {
                  eventId: event.id,
                  userId: user.id,
                  status: EventRegistrationStatus.APPROVED,
                },
                update: {
                  status: EventRegistrationStatus.APPROVED,
                },
              });
              registrationsCreated++;
            } catch {
              // Игнорируем ошибки дубликатов
            }
          }
        }
      }
    }

    if (registrationsCreated > 0) {
      console.log(`✅ Created ${registrationsCreated} registrations`);
    }

    // Перезагружаем события с новыми регистрациями
    const eventsWithRegistrations = await prisma.event.findMany({
      where: {
        id: { in: events.map((e) => e.id) },
      },
      include: {
        registrations: {
          where: {
            status: EventRegistrationStatus.APPROVED,
          },
          include: {
            user: true,
            team: true,
          },
        },
      },
    });

    // Очищаем существующие результаты (опционально, для чистого сида)
    await prisma.eventResult.deleteMany({});
    console.log('🧹 Cleared existing event results');

    let resultsCreated = 0;

    // Создаем результаты для каждого события
    for (const event of eventsWithRegistrations) {
      if (event.registrations.length === 0) {
        console.log(
          `⚠️  Skipping event ${event.name} - no approved registrations`,
        );
        continue;
      }

      // Для командных событий
      if (event.competitionType === 'TEAM') {
        const teams = event.registrations
          .map((r) => r.team)
          .filter((t): t is NonNullable<typeof t> => t !== null);

        // Убираем дубликаты команд
        const uniqueTeams = Array.from(
          new Map(teams.map((t) => [t.id, t])).values(),
        );

        if (uniqueTeams.length === 0) {
          continue;
        }

        // Сортируем команды случайным образом и присваиваем места
        const shuffled = uniqueTeams.sort(() => Math.random() - 0.5);
        const teamCount = Math.min(shuffled.length, 4); // Максимум 4 места

        for (let i = 0; i < teamCount; i++) {
          const team = shuffled[i];
          if (!team) continue;

          const placement =
            i === 0
              ? EventPlacement.FIRST
              : i === 1
                ? EventPlacement.SECOND
                : i === 2
                  ? EventPlacement.THIRD
                  : EventPlacement.PARTICIPATED;

          // Генерируем случайную статистику
          const kills = Math.floor(Math.random() * 20) + 5; // 5-25 убийств
          const deaths = Math.floor(Math.random() * 10) + 2; // 2-12 смертей
          const accuracy = Math.random() * 30 + 60; // 60-90% точность

          const points = calculatePoints(placement, kills, accuracy);

          await prisma.eventResult.create({
            data: {
              eventId: event.id,
              teamId: team.id,
              placement,
              points,
              kills,
              deaths,
              accuracy: new Prisma.Decimal(accuracy.toFixed(2)),
              status: EventResultStatus.CONFIRMED,
              confirmedAt: new Date(),
              confirmedBy: confirmedById,
            },
          });

          resultsCreated++;
        }
      }
      // Для индивидуальных событий
      else if (event.competitionType === 'INDIVIDUAL') {
        const users = event.registrations
          .map((r) => r.user)
          .filter((u): u is NonNullable<typeof u> => u !== null);

        // Убираем дубликаты пользователей
        const uniqueUsers = Array.from(
          new Map(users.map((u) => [u.id, u])).values(),
        );

        if (uniqueUsers.length === 0) {
          continue;
        }

        // Сортируем пользователей случайным образом и присваиваем места
        const shuffled = uniqueUsers.sort(() => Math.random() - 0.5);
        const userCount = Math.min(shuffled.length, 4); // Максимум 4 места

        for (let i = 0; i < userCount; i++) {
          const user = shuffled[i];
          if (!user) continue;

          const placement =
            i === 0
              ? EventPlacement.FIRST
              : i === 1
                ? EventPlacement.SECOND
                : i === 2
                  ? EventPlacement.THIRD
                  : EventPlacement.PARTICIPATED;

          // Генерируем случайную статистику
          const kills = Math.floor(Math.random() * 15) + 3; // 3-18 убийств
          const deaths = Math.floor(Math.random() * 8) + 1; // 1-9 смертей
          const accuracy = Math.random() * 25 + 65; // 65-90% точность

          const points = calculatePoints(placement, kills, accuracy);

          await prisma.eventResult.create({
            data: {
              eventId: event.id,
              userId: user.id,
              placement,
              points,
              kills,
              deaths,
              accuracy: new Prisma.Decimal(accuracy.toFixed(2)),
              status: EventResultStatus.CONFIRMED,
              confirmedAt: new Date(),
              confirmedBy: confirmedById,
            },
          });

          resultsCreated++;
        }
      }
    }

    console.log(`✅ Created ${resultsCreated} event results`);

    // Теперь обновляем статистику игроков на основе результатов
    console.log('📊 Updating player statistics...');

    const playerResults = await prisma.eventResult.findMany({
      where: {
        userId: { not: null },
        status: EventResultStatus.CONFIRMED,
      },
      include: {
        user: true,
      },
    });

    // Группируем результаты по пользователям
    const playerStatsMap = new Map<
      number,
      {
        gamesPlayed: number;
        wins: number;
        losses: number;
        draws: number;
        totalPoints: number;
        totalKills: number;
        totalDeaths: number;
        totalAccuracy: number;
        accuracyCount: number;
      }
    >();

    for (const result of playerResults) {
      if (!result.userId) continue;

      const stats = playerStatsMap.get(result.userId) || {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        totalPoints: 0,
        totalKills: 0,
        totalDeaths: 0,
        totalAccuracy: 0,
        accuracyCount: 0,
      };

      stats.gamesPlayed += 1;
      stats.totalPoints += result.points;

      if (result.placement === EventPlacement.FIRST) {
        stats.wins += 1;
      } else if (
        result.placement === EventPlacement.SECOND ||
        result.placement === EventPlacement.THIRD
      ) {
        stats.losses += 1;
      } else {
        stats.draws += 1;
      }

      if (result.kills) stats.totalKills += result.kills;
      if (result.deaths) stats.totalDeaths += result.deaths;
      if (result.accuracy) {
        stats.totalAccuracy += result.accuracy.toNumber();
        stats.accuracyCount += 1;
      }

      playerStatsMap.set(result.userId, stats);
    }

    const usersWithoutStats = allUsers.filter(
      (user) => !playerStatsMap.has(user.id),
    );
    const missingPlayersCount = Math.max(
      0,
      MIN_PLAYERS_FOR_PAGINATION - playerStatsMap.size,
    );

    for (const user of usersWithoutStats.slice(0, missingPlayersCount)) {
      const gamesPlayed = randomInt(2, 12);
      const wins = randomInt(0, gamesPlayed);
      const draws = randomInt(0, gamesPlayed - wins);
      const losses = gamesPlayed - wins - draws;
      const totalKills = randomInt(gamesPlayed * 3, gamesPlayed * 12);
      const totalDeaths = randomInt(Math.max(1, gamesPlayed), gamesPlayed * 8);
      const avgAccuracy = randomInt(55, 90);
      const averagePoints = randomInt(35, 120);
      const totalPoints = gamesPlayed * averagePoints;

      playerStatsMap.set(user.id, {
        gamesPlayed,
        wins,
        losses,
        draws,
        totalPoints,
        totalKills,
        totalDeaths,
        totalAccuracy: avgAccuracy * gamesPlayed,
        accuracyCount: gamesPlayed,
      });
    }

    // Обновляем PlayerStats
    for (const [userId, stats] of playerStatsMap.entries()) {
      const averagePoints =
        stats.gamesPlayed > 0 ? stats.totalPoints / stats.gamesPlayed : 0;
      const winRate =
        stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0;
      const kdRatio =
        stats.totalDeaths > 0
          ? stats.totalKills / stats.totalDeaths
          : stats.totalKills;
      const avgAccuracy =
        stats.accuracyCount > 0
          ? stats.totalAccuracy / stats.accuracyCount
          : null;

      await prisma.playerStats.upsert({
        where: { userId },
        create: {
          userId,
          gamesPlayed: stats.gamesPlayed,
          wins: stats.wins,
          losses: stats.losses,
          draws: stats.draws,
          points: 0, // Текущие очки (можно использовать для сезонов)
          totalPoints: stats.totalPoints,
          averagePoints: new Prisma.Decimal(averagePoints.toFixed(2)),
          winRate: new Prisma.Decimal(winRate.toFixed(2)),
          kdRatio: kdRatio > 0 ? new Prisma.Decimal(kdRatio.toFixed(2)) : null,
          accuracy: avgAccuracy
            ? new Prisma.Decimal(avgAccuracy.toFixed(2))
            : null,
        },
        update: {
          gamesPlayed: stats.gamesPlayed,
          wins: stats.wins,
          losses: stats.losses,
          draws: stats.draws,
          totalPoints: stats.totalPoints,
          averagePoints: new Prisma.Decimal(averagePoints.toFixed(2)),
          winRate: new Prisma.Decimal(winRate.toFixed(2)),
          kdRatio: kdRatio > 0 ? new Prisma.Decimal(kdRatio.toFixed(2)) : null,
          accuracy: avgAccuracy
            ? new Prisma.Decimal(avgAccuracy.toFixed(2))
            : null,
        },
      });
    }

    console.log(`✅ Updated ${playerStatsMap.size} player statistics`);

    // Обновляем статистику команд
    console.log('👥 Updating team statistics...');

    const teamResults = await prisma.eventResult.findMany({
      where: {
        teamId: { not: null },
        status: EventResultStatus.CONFIRMED,
      },
      include: {
        team: true,
      },
    });

    // Группируем результаты по командам
    const teamStatsMap = new Map<
      number,
      {
        gamesPlayed: number;
        wins: number;
        totalPoints: number;
      }
    >();

    for (const result of teamResults) {
      if (!result.teamId) continue;

      const stats = teamStatsMap.get(result.teamId) || {
        gamesPlayed: 0,
        wins: 0,
        totalPoints: 0,
      };

      stats.gamesPlayed += 1;
      stats.totalPoints += result.points;

      if (result.placement === EventPlacement.FIRST) {
        stats.wins += 1;
      }

      teamStatsMap.set(result.teamId, stats);
    }

    const teamsWithoutStats = allTeams.filter(
      (team) => !teamStatsMap.has(team.id),
    );
    const missingTeamsCount = Math.max(
      0,
      MIN_TEAMS_FOR_PAGINATION - teamStatsMap.size,
    );

    for (const team of teamsWithoutStats.slice(0, missingTeamsCount)) {
      const gamesPlayed = randomInt(2, 10);
      const wins = randomInt(0, gamesPlayed);
      const averagePoints = randomInt(45, 140);

      teamStatsMap.set(team.id, {
        gamesPlayed,
        wins,
        totalPoints: gamesPlayed * averagePoints,
      });
    }

    // Обновляем TeamStats
    for (const [teamId, stats] of teamStatsMap.entries()) {
      const averagePoints =
        stats.gamesPlayed > 0 ? stats.totalPoints / stats.gamesPlayed : 0;
      const winRate =
        stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0;

      await prisma.teamStats.upsert({
        where: { teamId },
        create: {
          teamId,
          gamesPlayed: stats.gamesPlayed,
          wins: stats.wins,
          totalPoints: stats.totalPoints,
          averagePoints: new Prisma.Decimal(averagePoints.toFixed(2)),
          winRate: new Prisma.Decimal(winRate.toFixed(2)),
        },
        update: {
          gamesPlayed: stats.gamesPlayed,
          wins: stats.wins,
          totalPoints: stats.totalPoints,
          averagePoints: new Prisma.Decimal(averagePoints.toFixed(2)),
          winRate: new Prisma.Decimal(winRate.toFixed(2)),
        },
      });
    }

    console.log(`✅ Updated ${teamStatsMap.size} team statistics`);

    // Пересчитываем рейтинги
    console.log('🏆 Calculating ranks...');

    // Рейтинги игроков
    const allPlayerStats = await prisma.playerStats.findMany({
      orderBy: { totalPoints: 'desc' },
    });

    for (let i = 0; i < allPlayerStats.length; i++) {
      const stats = allPlayerStats[i];
      if (!stats) continue;

      await prisma.playerStats.update({
        where: { userId: stats.userId },
        data: {
          rank: i + 1,
          previousRank: stats.rank,
        },
      });
    }

    console.log(`✅ Calculated ranks for ${allPlayerStats.length} players`);

    // Рейтинги команд
    const allTeamStats = await prisma.teamStats.findMany({
      orderBy: { totalPoints: 'desc' },
    });

    for (let i = 0; i < allTeamStats.length; i++) {
      const stats = allTeamStats[i];
      if (!stats) continue;

      await prisma.teamStats.update({
        where: { teamId: stats.teamId },
        data: {
          rank: i + 1,
        },
      });
    }

    console.log(`✅ Calculated ranks for ${allTeamStats.length} teams`);

    console.log('🎉 Ratings seed completed successfully!');
  } catch (error) {
    console.error('❌ Error while seeding ratings:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end().catch(() => undefined);
  }
}

void seedRatings();
