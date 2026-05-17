import { Injectable, Logger } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { NotificationType } from '../generated/prisma-client';
import { NotificationsRequest } from '../notifications/interfaces';
import { NotificationsDataService } from '../notifications/notifications-data.service';
import { UsersService } from '../users/users.service';
import { FRONTEND_BASE_URL } from '../utils/config';
import { TeamsDataService } from './teams-data.service';
import { TeamsPermissionsService } from './teams-permissions.service';

@Injectable()
export class TeamsNotificationService {
  private readonly logger = new Logger(TeamsNotificationService.name);
  constructor(
    private readonly teamsDataService: TeamsDataService,
    private readonly notificationsDataService: NotificationsDataService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
    private readonly permissionsService: TeamsPermissionsService,
  ) {}

  async notifyTeamDeleted(params: {
    teamId: number;
    teamName: string;
    recipientUserIds: number[];
  }): Promise<void> {
    const { teamId, teamName, recipientUserIds } = params;
    if (!recipientUserIds.length) return;

    const notificationsLink = `${FRONTEND_BASE_URL}/profile/team?state=none`;
    const notificationsPayload: NotificationsRequest[] = recipientUserIds.map(
      (uid) => ({
        userId: uid,
        type: NotificationType.TEAM_DELETED,
        title: 'Команду видалено',
        message: `Власник видалив команду "${teamName}".`,
        link: notificationsLink,
      }),
    );

    await this.notificationsDataService.createMany(notificationsPayload);
  }

  async notifyMemberLeftTeam(
    teamId: number,
    userId: number,
    memberName: string,
  ): Promise<void> {
    const team = await this.teamsDataService.findOne(teamId);
    if (!team) return;

    const managers = await this.permissionsService.getTeamManagers(teamId);
    if (!managers) return;

    const notificationsLink = `${FRONTEND_BASE_URL}/profile/team/?teamId=${teamId}`;

    const notificationsPayload: NotificationsRequest[] = managers.map(
      (manager) => ({
        userId: manager.id,
        type: NotificationType.TEAM_MEMBER_LEFT,
        title: 'Учасник покинув команду',
        message: `Учасник ${memberName} покинув команду "${team.name}".`,
        link: notificationsLink,
      }),
    );

    await this.notificationsDataService.createMany(notificationsPayload);
  }

  async notifyMemberRemovedFromTeam(
    teamId: number,
    userId: number,
  ): Promise<void> {
    const team = await this.teamsDataService.findOne(teamId);
    const user = await this.usersService.getUser({ id: userId });
    if (!team || !user) return;

    const notificationsLink = `${FRONTEND_BASE_URL}/profile/team?state=none`;

    await this.notificationsDataService.create({
      userId,
      type: NotificationType.TEAM_MEMBER_REMOVED,
      title: 'Вас видалено з команди',
      message: `Вас видалено з команди "${team.name}".`,
      link: notificationsLink,
    });

    await this.emailService.send({
      email: user.email,
      metadata: {
        template: 'team-member-removed',
        subject: 'Вас видалено з команди',
        teamName: team.name,
        notificationsLink,
      },
    });
  }

  async notifyTeamInvitation(
    teamId: number,
    inviterId: number,
    inviteeId: number,
  ): Promise<void> {
    const [team, inviter, invitee] = await Promise.all([
      this.teamsDataService.findOne(teamId),
      this.usersService.getUser({ id: inviterId }),
      this.usersService.getUser({ id: inviteeId }),
    ]);

    if (!team || !inviter || !invitee) {
      return;
    }

    const inviterName = inviter.nickName || inviter.fullName || inviter.email;
    const notificationsLink = `${FRONTEND_BASE_URL}/profile/notifications#invite`;

    await this.notificationsDataService.create({
      userId: inviteeId,
      type: NotificationType.TEAM_INVITATION,
      title: 'Запрошення до команди',
      message: `Вас запросили до команди "${team.name}".`,
      link: notificationsLink,
    });

    await this.emailService.send({
      email: invitee.email,
      metadata: {
        template: 'team-invitation',
        subject: 'Запрошення до команди',
        teamName: team.name,
        inviterName,
        notificationsLink,
      },
    });
  }

  async notifyTeamInvitationAccepted(
    teamId: number,
    inviterId: number,
    userId: number,
  ): Promise<void> {
    const [team, user, inviter] = await Promise.all([
      this.teamsDataService.findOne(teamId),
      this.usersService.getUser({ id: userId }),
      this.usersService.getUser({ id: inviterId }),
    ]);

    if (!team || !user || !inviter) {
      return;
    }

    const userName = user.nickName || user.fullName || user.email;
    const notificationsLink = `${FRONTEND_BASE_URL}/profile/team/?teamId=${teamId}`;

    await this.notificationsDataService.create({
      userId: inviterId,
      type: NotificationType.TEAM_INVITATION,
      title: 'Запрошення прийнято',
      message: `Запрошення до команди "${team.name}" прийнято.`,
      link: notificationsLink,
    });

    try {
      await this.emailService.send({
        email: inviter.email,
        metadata: {
          template: 'team-invitation-accepted',
          subject: 'Запрошення прийнято',
          teamName: team.name,
          userName,
          notificationsLink,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send team invitation accepted email: ${error}`,
      );
    }
  }

  async notifyTeamInvitationRejected(
    teamId: number,
    inviterId: number,
    userId: number,
  ): Promise<void> {
    const [team, user, inviter] = await Promise.all([
      this.teamsDataService.findOne(teamId),
      this.usersService.getUser({ id: userId }),
      this.usersService.getUser({ id: inviterId }),
    ]);

    if (!team || !user || !inviter) {
      return;
    }

    const userName = user.nickName || user.fullName || user.email;
    const notificationsLink = `${FRONTEND_BASE_URL}/profile/team?teamId=${teamId}&tab=edit`;

    await this.notificationsDataService.create({
      userId: inviterId,
      type: NotificationType.TEAM_INVITATION,
      title: 'Запрошення відхилено',
      message: `Запрошення до команди "${team.name}" відхилено.`,
      link: notificationsLink,
    });

    try {
      await this.emailService.send({
        email: inviter.email,
        metadata: {
          template: 'team-invitation-rejected',
          subject: 'Запрошення відхилено',
          teamName: team.name,
          userName,
          notificationsLink,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to send team invitation rejected email: ${error}`,
      );
    }
  }

  async notifyTeamJoinRequest(
    teamId: number,
    applicantId: number,
  ): Promise<void> {
    const team = await this.teamsDataService.findOne(teamId);
    const applicant = await this.usersService.getUser({ id: applicantId });
    if (!team || !applicant) return;

    const managers = await this.permissionsService.getTeamManagers(teamId);
    if (!managers) return;

    const applicantName =
      applicant.nickName || applicant.fullName || applicant.email;

    const notificationsLink = `${FRONTEND_BASE_URL}/profile/team?teamId=${teamId}&tab=applications`;
    const applicantProfileLink = `${FRONTEND_BASE_URL}/profile/${applicant.id}`;

    const notificationsPayload: NotificationsRequest[] = managers.map(
      (manager) => ({
        userId: manager.id,
        type: NotificationType.TEAM_JOIN_REQUEST,
        title: 'До Вашої команди бажають вступити',
        message: `Користувач ${applicantName} хоче вступити до команди ${team.name}. Перейдіть у особистий кабінет для підтвердження заявки.`,
        link: notificationsLink,
      }),
    );

    try {
      await this.notificationsDataService.createMany(notificationsPayload);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to persist team join request notifications | ${JSON.stringify({
          teamId,
          applicantId,
          managerIds: managers.map((manager) => manager.id),
          reason,
        })}`,
      );
    }

    const emailResults = await Promise.allSettled(
      managers.map((manager) =>
        this.emailService.send({
          email: manager.email,
          metadata: {
            template: 'team-join-request',
            subject: 'До Вашої команди бажають вступити',
            teamName: team.name,
            applicantName,
            notificationsLink,
            applicantProfileLink,
          },
        }),
      ),
    );

    emailResults.forEach((result, index) => {
      if (result.status === 'rejected') {
        const reason =
          result.reason instanceof Error
            ? result.reason.message
            : String(result.reason);
        const manager = managers[index];
        this.logger.warn(
          `Failed to send join request email | ${JSON.stringify({
            teamId,
            applicantId,
            managerId: manager.id,
            managerEmail: manager.email,
            provider: 'sendgrid',
            reason,
          })}`,
        );
      }
    });
  }

  async notifyTeamApproved(teamId: number, userId: number): Promise<void> {
    const team = await this.teamsDataService.findOne(teamId);
    const user = await this.usersService.getUser({ id: userId });
    if (!team || !user) return;

    const notificationsLink = `${FRONTEND_BASE_URL}/profile/team/?teamId=${teamId}`;
    const text = `Вітаємо! Ваш запит на приєднання до команди “${team.name}” схвалено.`;

    await this.notificationsDataService.create({
      userId,
      type: NotificationType.TEAM_JOIN_REQUEST_APPROVED,
      title: 'Підтвердження на вступ до команди',
      message: text,
      link: notificationsLink,
    });

    try {
      await this.emailService.send({
        email: user.email,
        metadata: {
          template: 'team-approved',
          subject: 'Підтвердження на вступ до команди',
          teamName: team.name,
          text,
          notificationsLink,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send team approved email: ${error}`);
    }
  }

  async notifyTeamRejected(teamId: number, userId: number): Promise<void> {
    const team = await this.teamsDataService.findOne(teamId);
    const user = await this.usersService.getUser({ id: userId });
    if (!team || !user) return;

    const notificationsLink = `${FRONTEND_BASE_URL}/profile/team/?teamId=${teamId}&tab=join`;

    await this.notificationsDataService.create({
      userId,
      type: NotificationType.TEAM_JOIN_REQUEST_REJECTED,
      title: 'Вашу заявку відхилено',
      message: `Вашу заявку на вступ до команди "${team.name}" відхилено.`,
      link: notificationsLink,
    });

    await this.emailService.send({
      email: user.email,
      metadata: {
        template: 'team-rejected',
        subject: 'Вашу заявку відхилено',
        teamName: team.name,
        notificationsLink,
      },
    });
  }

  async notifyOwnershipTransferRequest(
    teamId: number,
    newOwnerId: number,
    userId: number,
  ): Promise<void> {
    const team = await this.teamsDataService.findOne(teamId);
    const newOwner = await this.usersService.getUser({ id: newOwnerId });
    const user = await this.usersService.getUser({ id: userId });
    if (!team || !newOwner || !user) return;

    const notificationsLink = `${FRONTEND_BASE_URL}/profile/notifications#invite`;

    const notificationsPayload: NotificationsRequest = {
      userId: newOwnerId,
      type: NotificationType.TRANSFER_OWNERSHIP,
      title: 'Вам запропонували право власності на команду',
      message: `Учасник ${user.nickName || user.fullName} хоче передати вам права капітана команди "${team.name}".`,
      link: notificationsLink,
    };
    await this.notificationsDataService.create(notificationsPayload);
    try {
      await this.emailService.send({
        email: newOwner.email,
        metadata: {
          template: 'team-ownership-transfer-request',
          subject: 'Вам запропонували право власності на команду',
          teamName: team.name,
          applicantName: user.nickName || user.fullName || user.email,
          notificationsLink,
          applicantProfileLink: `${FRONTEND_BASE_URL}/profile/${user.id}`,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send ownership transfer email: ${error}`);
    }
  }

  async notifyOwnershipTransferRejected(
    teamId: number,
    wishfulNewOwnerId: number,
    ownerId: number,
  ): Promise<void> {
    const [team, newOwner, owner] = await Promise.all([
      this.teamsDataService.findOne(teamId),
      this.usersService.getUser({ id: wishfulNewOwnerId }),
      this.usersService.getUser({ id: ownerId }),
    ]);

    if (!team || !newOwner || !owner) return;
    const notificationsLink = `${FRONTEND_BASE_URL}/profile/team?teamId=${teamId}`;

    const notificationsPayload: NotificationsRequest = {
      userId: ownerId,
      type: NotificationType.TRANSFER_OWNERSHIP,
      title: 'Вашу заявку відхилено',
      message: `Учасник ${newOwner.nickName || newOwner.fullName} відхилив запит на прийняття права власності на команду "${team.name}"`,
      link: notificationsLink,
    };
    await this.notificationsDataService.create(notificationsPayload);
    try {
      await this.emailService.send({
        email: owner.email,
        metadata: {
          template: 'team-ownership-transfer-rejected',
          subject: `Вашу заявку на передачу права власності на команду "${team.name}" відхилено`,
          teamName: team.name,
          applicantName:
            newOwner.nickName || newOwner.fullName || newOwner.email,
          notificationsLink,
          applicantProfileLink: `${FRONTEND_BASE_URL}/profile/${newOwner.id}`,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send ownership transfer email: ${error}`);
    }
  }

  async notifyOwnershipTransferAccepted(
    teamId: number,
    ownerId: number,
    newOwnerId: number,
  ): Promise<void> {
    const team = await this.teamsDataService.findOne(teamId);
    const newOwner = await this.usersService.getUser({ id: newOwnerId });
    const owner = await this.usersService.getUser({ id: ownerId });
    if (!team || !newOwner || !owner) return;

    const notificationsLink = `${FRONTEND_BASE_URL}/profile/team?teamId=${teamId}`;

    const notificationsPayload: NotificationsRequest = {
      userId: ownerId,
      type: NotificationType.TRANSFER_OWNERSHIP,
      title: 'Вашу заявку прийнято',
      message: `Учасник ${newOwner.nickName || newOwner.fullName} прийняв запит на прийняття права власності на команду "${team.name}"`,
      link: notificationsLink,
    };
    await this.notificationsDataService.create(notificationsPayload);
    try {
      await this.emailService.send({
        email: owner.email,
        metadata: {
          template: 'team-ownership-transfer-accepted',
          subject: `Вашу заявку на передачу права власності на команду "${team.name}" прийнято`,
          teamName: team.name,
          applicantName:
            newOwner.nickName || newOwner.fullName || newOwner.email,
          notificationsLink,
          applicantProfileLink: `${FRONTEND_BASE_URL}/profile/${owner.id}`,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to send ownership transfer email: ${error}`);
    }
  }

  async notifyOwnershipReassignedByAdmin(
    teamId: number,
    oldOwnerId: number,
    newOwnerId: number,
    adminUserId: number,
  ): Promise<void> {
    const [team, oldOwner, newOwner, admin] = await Promise.all([
      this.teamsDataService.findOne(teamId),
      this.usersService.getUser({ id: oldOwnerId }),
      this.usersService.getUser({ id: newOwnerId }),
      this.usersService.getUser({ id: adminUserId }),
    ]);

    if (!team || !oldOwner || !newOwner || !admin) {
      return;
    }

    const adminName = admin.nickName || admin.fullName || admin.email;
    const oldOwnerName =
      oldOwner.nickName || oldOwner.fullName || oldOwner.email;
    const newOwnerName =
      newOwner.nickName || newOwner.fullName || newOwner.email;
    const notificationsLink = `${FRONTEND_BASE_URL}/profile/team?teamId=${teamId}`;

    await this.notificationsDataService.createMany([
      {
        userId: oldOwnerId,
        type: NotificationType.TRANSFER_OWNERSHIP,
        title: 'Власника команди змінено адміністратором',
        message: `Адміністратор ${adminName} переназначив власника команди "${team.name}". Новий власник — ${newOwnerName}.`,
        link: notificationsLink,
      },
      {
        userId: newOwnerId,
        type: NotificationType.TRANSFER_OWNERSHIP,
        title: 'Вас призначено власником команди',
        message: `Адміністратор ${adminName} призначив вас власником команди "${team.name}".`,
        link: notificationsLink,
      },
    ]);

    await Promise.allSettled([
      this.emailService.send({
        email: oldOwner.email,
        metadata: {
          template: 'team-owner-reassigned-old-owner',
          subject: 'Власника команди змінено',
          teamName: team.name,
          adminName,
          newOwnerName,
          notificationsLink,
        },
      }),
      this.emailService.send({
        email: newOwner.email,
        metadata: {
          template: 'team-owner-reassigned-new-owner',
          subject: 'Вас призначено власником команди',
          teamName: team.name,
          adminName,
          oldOwnerName,
          notificationsLink,
        },
      }),
    ]);
  }
}
