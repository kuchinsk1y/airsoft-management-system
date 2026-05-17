import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { AclService } from '../acl/acl.service';
import { ApplicationsService } from '../applications/applications.service';
import { EmailService } from '../email/email.service';
import { TicketPdfService } from '../email/ticket-pdf.service';
import {
  EventRegistrationStatus,
  EventStatus,
  NotificationType,
} from '../generated/prisma-client';
import { NotificationsService } from '../notifications/notifications.service';
import { OrganizationService } from '../organization/organization.service';
import { TeamsDataService } from '../teams/teams-data.service';
import { SmsService } from '../sms/sms.service';
import { UsersService } from '../users/users.service';
import { ADMIN_BASE_URL, FRONTEND_BASE_URL } from '../utils/config';
import { EventsDataService } from './events-data.service';
import { EventsRegistrationDataService } from './events-registration-data.service';
import { EventRegistrationForReminder, EventsResponse } from './interfaces';

@Injectable()
export class EventsNotificationService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(EventsNotificationService.name);
  private readonly windowHours = 48;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(
    private readonly eventsDataService: EventsDataService,
    private readonly eventsRegistrationDataService: EventsRegistrationDataService,
    private readonly notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
    private readonly applicationsService: ApplicationsService,
    private readonly teamsDataService: TeamsDataService,
    private readonly smsService: SmsService,
    private readonly organizationService: OrganizationService,
    private readonly ticketPdfService: TicketPdfService,
    private readonly aclService: AclService,
  ) {}

  onModuleInit() {
    const intervalMs = 30 * 60 * 1000;
    this.intervalId = setInterval(() => {
      void this.handleEventReminders().catch(() => {});
    }, intervalMs);
  }

  onModuleDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  async notifyEventRegistration(
    eventId: number,
    userId: number,
    eventName: string,
  ): Promise<void> {
    const user = await this.usersService.getUser({ id: userId });
    if (!user) return;

    const organization = await this.organizationService.getOrganization();

    const notificationsLink = `${FRONTEND_BASE_URL}/events/${eventId}`;

    await this.notificationsService.createNotification({
      userId,
      type: NotificationType.EVENT_REGISTRATION,
      title: 'Реєстрація на подію',
      message: `Ви зареєструвалися на подію "${eventName}". Очікуйте підтвердження оплати — після цього білет надійде на пошту та в особистому кабінеті.`,
      link: notificationsLink,
    });

    const promises = [
      this.emailService.send({
        email: user.email,
        metadata: {
          template: 'event-registration',
          subject: 'Реєстрація на подію',
          eventName,
          notificationsLink,
        },
      }),
    ];

    if (organization.registrationSmsEnabled && user.phoneNumber?.trim()) {
      promises.push(
        this.smsService.sendRegistrationSms(
          user.phoneNumber.trim(),
          user.nickName || user.fullName || user.email,
        ),
      );
    }

    await Promise.all(promises);
  }

  buildTicketData(event: EventsResponse): {
    eventDate: string;
    eventTime: string;
    location: string;
    phoneNumber?: string | null;
  } {
    const start =
      event.gameStartDate instanceof Date
        ? event.gameStartDate
        : new Date(event.gameStartDate);
    const eventDate = start.toLocaleDateString('uk-UA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const eventTime = start.toLocaleTimeString('uk-UA', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const locationParts = [
      event.address,
      event.city?.name,
      event.city?.region?.name,
    ].filter(Boolean);
    const location = locationParts.join(', ');
    const phoneNumber = event.application?.phoneNumber ?? null;
    return { eventDate, eventTime, location, phoneNumber };
  }

  async sendTicketEmail(
    event: EventsResponse,
    userId: number,
    options?: { createInAppNotification?: boolean },
  ): Promise<void> {
    const user = await this.usersService.getUser({ id: userId });
    if (!user) return;

    const notificationsLink = `${FRONTEND_BASE_URL}/events/${event.id}`;
    const ticketData = this.buildTicketData(event);
    const title = 'Реєстрацію на подію підтверджено';
    const message = `Вашу реєстрацію на подію "${event.name}" підтверджено. Білет у листі та в особистому кабінеті.`;

    if (options?.createInAppNotification) {
      await this.notificationsService.createNotification({
        userId,
        type: NotificationType.EVENT_REGISTRATION,
        title,
        message,
        link: notificationsLink,
      });
    }

    const pdfBuffer = await this.ticketPdfService.generate({
      eventName: event.name,
      ...ticketData,
    });
    const fileName = `bilett-${event.name.replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-') || 'podiya'}.pdf`;
    await this.emailService.send({
      email: user.email,
      attachments: [{ filename: fileName, content: pdfBuffer }],
      metadata: {
        template: 'event-registration-approved',
        subject: title,
        eventName: event.name,
        notificationsLink,
        eventDate: ticketData.eventDate,
        eventTime: ticketData.eventTime,
        location: ticketData.location,
        ...(ticketData.phoneNumber != null && {
          phoneNumber: ticketData.phoneNumber,
        }),
      },
    });
  }

  async sendTicketsForOrder(orderId: number): Promise<void> {
    const registrations = await this.eventsRegistrationDataService.findMany(
      undefined,
      { orderId, status: EventRegistrationStatus.APPROVED },
    );
    for (const reg of registrations) {
      try {
        const event = await this.eventsDataService.findById(reg.eventId);
        await this.sendTicketEmail(event, reg.userId, {
          createInAppNotification: true,
        });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `sendTicketEmail failed for order ${orderId} reg ${reg.eventId}/${reg.userId}: ${message}`,
        );
      }
    }
  }

  async notifyEventRegistrationStatus(
    eventId: number,
    userId: number,
    eventName: string,
    status: 'APPROVED' | 'REJECTED',
    event?: EventsResponse,
  ): Promise<void> {
    const user = await this.usersService.getUser({ id: userId });
    if (!user) return;

    const notificationsLink = `${FRONTEND_BASE_URL}/events/${eventId}`;
    const title =
      status === 'APPROVED'
        ? 'Реєстрацію на подію підтверджено'
        : 'Реєстрацію на подію відхилено';
    const message =
      status === 'APPROVED'
        ? `Вашу реєстрацію на подію "${eventName}" підтверджено.`
        : `Вашу реєстрацію на подію "${eventName}" відхилено.`;

    await this.notificationsService.createNotification({
      userId,
      type: NotificationType.EVENT_REGISTRATION,
      title,
      message,
      link: notificationsLink,
    });

    if (status === 'APPROVED' && event) {
      const ticketData = this.buildTicketData(event);
      const pdfBuffer = await this.ticketPdfService.generate({
        eventName,
        ...ticketData,
      });
      const fileName = `bilett-${eventName.replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-') || 'podiya'}.pdf`;
      await this.emailService.send({
        email: user.email,
        attachments: [{ filename: fileName, content: pdfBuffer }],
        metadata: {
          template: 'event-registration-approved',
          subject: title,
          eventName,
          notificationsLink,
          eventDate: ticketData.eventDate,
          eventTime: ticketData.eventTime,
          location: ticketData.location,
          ...(ticketData.phoneNumber != null && {
            phoneNumber: ticketData.phoneNumber,
          }),
        },
      });
    } else {
      await this.emailService.send({
        email: user.email,
        metadata: {
          template: `event-registration-${status.toLowerCase()}`,
          subject: title,
          eventName,
          notificationsLink,
        },
      });
    }
  }

  async notifyTeamEventsRequirePayment(
    userId: number,
    eventNames: string[],
    eventIds: number[],
  ): Promise<void> {
    const user = await this.usersService.getUser({ id: userId });
    if (!user || eventNames.length === 0) return;

    const eventsList = eventNames.join(', ');
    const firstEventLink =
      eventIds.length > 0
        ? `${FRONTEND_BASE_URL}/events/${eventIds[0]}`
        : `${FRONTEND_BASE_URL}/events`;

    await Promise.all([
      this.notificationsService.createNotification({
        userId,
        type: NotificationType.EVENT_REGISTRATION,
        title: 'Ваша команда зареєстрована на події',
        message: `Ваша команда зареєстрована на події: ${eventsList}. Для участі необхідно зареєструватися та оплатити через корзину.`,
        link: firstEventLink,
      }),
      this.emailService.send({
        email: user.email,
        metadata: {
          template: 'team-events-require-payment',
          subject: 'Ваша команда зареєстрована на події',
          eventsList,
          notificationsLink: firstEventLink,
        },
      }),
    ]);
  }

  async notifyRegistrationCancelled(
    eventId: number,
    event: EventsResponse,
    userId: number,
  ): Promise<void> {
    const user = await this.usersService.getUser({ id: userId });
    if (!user) return;

    const application = await this.applicationsService.get({
      id: event.applicationId,
    });

    const userNotificationsLink = `${FRONTEND_BASE_URL}/events/${eventId}`;
    const adminNotificationsLink = `${ADMIN_BASE_URL}/events/${eventId}`;
    const userName = user.nickName || user.fullName || user.email;

    const promises: Promise<unknown>[] = [
      this.notificationsService.createNotification({
        userId,
        type: NotificationType.EVENT_REGISTRATION,
        title: 'Реєстрацію на подію скасовано',
        message: `Вашу реєстрацію на подію "${event.name}" скасовано.`,
        link: userNotificationsLink,
      }),
      this.emailService.send({
        email: user.email,
        metadata: {
          template: 'event-registration-cancelled',
          subject: 'Реєстрацію на подію скасовано',
          eventName: event.name,
          notificationsLink: userNotificationsLink,
        },
      }),
    ];

    if (application?.ownerId) {
      promises.push(
        (async () => {
          const applicationOwner = await this.usersService.getUser({
            id: application.ownerId,
          });
          if (!applicationOwner) return;

          await Promise.all([
            this.notificationsService.createNotification({
              userId: application.ownerId,
              type: NotificationType.EVENT_REGISTRATION,
              title: 'Реєстрацію на подію скасовано',
              message: `Користувач ${userName} скасував реєстрацію на подію "${event.name}".`,
              link: adminNotificationsLink,
            }),
            this.emailService.send({
              email: applicationOwner.email,
              metadata: {
                template: 'event-registration-cancelled-application',
                subject: 'Реєстрацію на подію скасовано',
                eventName: event.name,
                userName,
                notificationsLink: adminNotificationsLink,
              },
            }),
          ]);
        })(),
      );
    }

    await Promise.all(promises);
  }

  async notifyApplicationNewRegistration(
    eventId: number,
    event: EventsResponse,
    applicantId: number,
    teamId?: number,
    isTeamRegistration?: boolean,
  ): Promise<void> {
    const application = await this.applicationsService.get({
      id: event.applicationId,
    });
    if (!application?.ownerId) return;

    const applicationOwnerId = application.ownerId;

    const applicationOwner = await this.usersService.getUser({
      id: applicationOwnerId,
    });
    if (!applicationOwner) return;

    const notificationsLink = `${ADMIN_BASE_URL}/events/${eventId}`;

    let title: string;
    let message: string;
    let emailMetadata: {
      template: string;
      subject: string;
      eventName: string;
      notificationsLink: string;
      applicantName?: string;
      teamName?: string;
      membersCount?: number;
    };

    if (teamId && isTeamRegistration) {
      const team = await this.teamsDataService.findOne(teamId);
      if (!team) return;

      const teamMembers = team.members || [];
      const membersCount = teamMembers.length;

      title = 'Нова реєстрація команди на подію';
      message = `Команда "${team.name}" (${membersCount} учасників) зареєструвалася на подію "${event.name}". Перейдіть в адмінку для підтвердження.`;

      emailMetadata = {
        template: 'event-new-team-registration',
        subject: title,
        eventName: event.name,
        teamName: team.name,
        membersCount,
        notificationsLink,
      };
    } else {
      const applicant = await this.usersService.getUser({ id: applicantId });
      if (!applicant) return;

      const applicantName =
        applicant.nickName || applicant.fullName || applicant.email;

      title = 'Нова реєстрація на подію';
      message = `Користувач ${applicantName} зареєструвався на подію "${event.name}". Перейдіть в адмінку для підтвердження.`;

      emailMetadata = {
        template: 'event-new-registration',
        subject: title,
        eventName: event.name,
        applicantName,
        notificationsLink,
      };
    }

    await this.notificationsService.createNotification({
      userId: applicationOwnerId,
      type: NotificationType.EVENT_REGISTRATION,
      title,
      message,
      link: notificationsLink,
    });

    await this.emailService.send({
      email: applicationOwner.email,
      metadata: emailMetadata,
    });
  }

  async notifyEventReminder(
    userId: number,
    eventId: number,
    eventName: string,
    eventDate: Date,
  ): Promise<void> {
    const user = await this.usersService.getUser({ id: userId });
    if (!user) return;

    const link = `${FRONTEND_BASE_URL}/events/${eventId}`;
    const title = 'Нагадування про гру';
    const message = `Нагадування: подія "${eventName}" почнеться ${eventDate.toLocaleString()}.`;

    await Promise.allSettled([
      this.notificationsService.createNotification({
        userId,
        type: NotificationType.EVENT_REMINDER,
        title,
        message,
        link,
      }),
      this.emailService.send({
        email: user.email,
        metadata: {
          template: 'event-reminder',
          subject: title,
          eventName,
          eventDate: eventDate.toLocaleString(),
          notificationsLink: link,
        },
      }),
    ]);
  }

  async notifyAdminsNewEvent(event: EventsResponse): Promise<void> {
    const adminUserIds = Array.from(
      new Set(await this.aclService.findAdminUserIds()),
    );
    if (adminUserIds.length === 0) return;

    const adminUrl = `${ADMIN_BASE_URL}/events?tab=pending`;
    const organizerName =
      event.application.owner.fullName ?? event.application.owner.nickName;

    for (const adminId of adminUserIds) {
      const admin = await this.usersService.getUser({ id: adminId });
      if (!admin?.email) continue;

      await this.notificationsService.createNotification({
        userId: adminId,
        type: NotificationType.SYSTEM,
        title: 'Нова подія на розгляді',
        message: `Подія "${event.name}" від ${organizerName} очікує підтвердження.`,
        link: adminUrl,
      });

      await this.emailService.send({
        email: admin.email,
        metadata: {
          template: 'event-pending-admin',
          subject: 'Нова подія очікує підтвердження',
          eventName: event.name,
          organizerName,
          gameStartDate: event.gameStartDate.toISOString(),
          adminUrl,
        },
      });
    }
  }

  async notifyOrganizerEventStatus(
    organizerUserId: number,
    event: EventsResponse,
    status: EventStatus,
    reason?: string,
  ): Promise<void> {
    const organizer = await this.usersService.getUser({ id: organizerUserId });
    if (!organizer?.email) return;

    const isApproved = status === EventStatus.APPROVED;
    const eventLink = `${FRONTEND_BASE_URL}/events/${event.id}`;
    const title = isApproved ? 'Подію схвалено' : 'Подію відхилено';
    const message = isApproved
      ? `Вашу подію "${event.name}" схвалено. Вона доступна для реєстрації.`
      : `Вашу подію "${event.name}" відхилено.${reason ? ` Причина: ${reason}` : ''}`;

    await this.notificationsService.createNotification({
      userId: organizerUserId,
      type: NotificationType.SYSTEM,
      title,
      message,
      link: isApproved ? eventLink : undefined,
    });

    await this.emailService.send({
      email: organizer.email,
      metadata: {
        template: 'event-status-organizer',
        subject: isApproved
          ? 'Заявку на створення події схвалено'
          : 'Заявку на створення події відхилено',
        eventName: event.name,
        isApproved,
        ...(reason ? { secondaryText: `Причина: ${reason}` } : {}),
        ...(isApproved ? { eventLink } : {}),
      },
    });
  }

  async handleEventReminders(): Promise<void> {
    const now = new Date();
    const windowEnd = new Date(
      now.getTime() + this.windowHours * 60 * 60 * 1000,
    );

    const registrations = (await this.eventsRegistrationDataService.findMany(
      undefined,
      {
        status: EventRegistrationStatus.APPROVED,
        event: {
          isCompleted: false,
          gameStartDate: {
            gt: now,
            lte: windowEnd,
          },
          OR: [{ endDate: null }, { endDate: { gt: now } }],
        },
      },
      {
        event: true,
      },
    )) as unknown as EventRegistrationForReminder[];

    for (const registration of registrations) {
      const event = registration.event;
      if (!event) continue;

      const gameStartDate =
        event.gameStartDate instanceof Date
          ? event.gameStartDate
          : new Date(event.gameStartDate);

      const link = `${FRONTEND_BASE_URL}/events/${event.id}`;
      const createdAtGte = new Date(
        gameStartDate.getTime() - (this.windowHours + 1) * 60 * 60 * 1000,
      );

      const existingReminder = await this.notificationsService.getNotification({
        userId: registration.userId,
        type: NotificationType.EVENT_REMINDER,
        link,
        createdAt: {
          gte: createdAtGte,
        },
      });
      if (existingReminder) {
        continue;
      }

      await this.notifyEventReminder(
        registration.userId,
        event.id,
        event.name,
        gameStartDate,
      );
    }
  }
}
