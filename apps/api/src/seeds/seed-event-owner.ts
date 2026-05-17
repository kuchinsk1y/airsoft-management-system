import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import {
  CompetitionType,
  EventPlacement,
  EventRegistrationStatus,
  EventResultStatus,
  PaymentMethod,
  Prisma,
  PrismaClient,
} from '../generated/prisma-client';
import { DATABASE_URL } from '../utils/config';
import { regionSlugForCityName } from '../cities/city-region-slug';
import { generateSlug } from '../utils/slug';

const pool = new Pool({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function getOrCreateCity(cityName: string): Promise<number> {
  const slug = generateSlug(cityName);

  let city = await prisma.city.findFirst({
    where: {
      OR: [{ name: cityName }, { slug }],
    },
  });

  if (city) {
    return city.id;
  }

  try {
    const regionSlug = regionSlugForCityName(cityName) ?? 'vinnicka-oblast';
    const region = await prisma.region.findUnique({
      where: { slug: regionSlug },
    });
    if (!region) {
      throw new Error(`Region not found for slug: ${regionSlug}`);
    }
    city = await prisma.city.create({
      data: {
        name: cityName,
        slug,
        regionId: region.id,
      },
    });
    return city.id;
  } catch {
    city = await prisma.city.findFirst({
      where: {
        OR: [{ name: cityName }, { slug }],
      },
    });
    if (city) {
      return city.id;
    }
    throw new Error(`Failed to create or find city: ${cityName}`);
  }
}

async function seedEventOwner() {
  try {
    console.log('🌱 Starting event owner seed...');

    // Создаем или находим пользователя
    const email = 'event.owner@example.com';
    const password = 'Passw0rd!';
    const nickName = 'EventOwner';

    let owner = await prisma.user.findUnique({
      where: { email },
    });

    if (!owner) {
      const hashedPassword = await bcrypt.hash(password, 10);
      owner = await prisma.user.create({
        data: {
          email,
          nickName,
          fullName: 'Event Owner',
          password: hashedPassword,
          dateOfBirth: new Date('1990-01-01'),
          country: 'UA',
          region: 'Kyiv',
          city: 'Київ',
          isVerified: true,
        },
      });
      console.log(`✅ Created user: ${email}`);
    } else {
      console.log(`ℹ️  User already exists: ${email}`);
    }

    // Создаем или находим организацию
    let application = await prisma.application.findFirst({
      where: { ownerId: owner.id },
    });

    if (!application) {
      application = await prisma.application.create({
        data: {
          uid: randomUUID(),
          name: 'Elite Strike Events',
          address: 'Київ, Україна',
          phoneNumber: '+380501234567',
          description: 'Організатор преміальних страйкбольних подій',
          ownerId: owner.id,
        },
      });
      console.log(`✅ Created application: ${application.name}`);
    } else {
      console.log(`ℹ️  Application already exists: ${application.name}`);
    }

    // Получаем или создаем города
    const kyivCityId = await getOrCreateCity('Київ');
    const lvivCityId = await getOrCreateCity('Львів');

    // Создаем несколько завершенных событий
    const now = new Date();
    const pastDate1 = new Date(now);
    pastDate1.setDate(pastDate1.getDate() - 7); // 7 дней назад
    const pastDate2 = new Date(now);
    pastDate2.setDate(pastDate2.getDate() - 5); // 5 дней назад
    const pastDate3 = new Date(now);
    pastDate3.setDate(pastDate3.getDate() - 3); // 3 дня назад

    // Даты для незавершенных событий (для тестирования функции завершения)
    const pastDate4 = new Date(now);
    pastDate4.setDate(pastDate4.getDate() - 5); // 5 дней назад
    const pastDate5 = new Date(now);
    pastDate5.setDate(pastDate5.getDate() - 3); // 3 дня назад
    const pastDate6 = new Date(now);
    pastDate6.setHours(pastDate6.getHours() - 12); // 12 часов назад
    const pastDate7 = new Date(now);
    pastDate7.setDate(pastDate7.getDate() - 10); // 10 дней назад
    const pastDate8 = new Date(now);
    pastDate8.setDate(pastDate8.getDate() - 7); // 7 дней назад
    const futureDate1 = new Date(now);
    futureDate1.setDate(futureDate1.getDate() + 3); // 3 дня вперед
    const futureDate2 = new Date(now);
    futureDate2.setDate(futureDate2.getDate() + 7); // 7 дней вперед
    const pastDate9 = new Date(now);
    pastDate9.setDate(pastDate9.getDate() - 4); // 4 дня назад
    const pastDate10 = new Date(now);
    pastDate10.setDate(pastDate10.getDate() - 6); // 6 дней назад
    const pastDate11 = new Date(now);
    pastDate11.setHours(pastDate11.getHours() - 3); // 3 часа назад
    const futureDate3 = new Date(now);
    futureDate3.setDate(futureDate3.getDate() + 5); // 5 дней вперед
    const yesterday1 = new Date(now);
    yesterday1.setDate(yesterday1.getDate() - 1); // Вчера
    yesterday1.setHours(10, 0, 0, 0); // 10:00 вчера
    const yesterday2 = new Date(now);
    yesterday2.setDate(yesterday2.getDate() - 1); // Вчера
    yesterday2.setHours(14, 0, 0, 0); // 14:00 вчера
    const yesterday3 = new Date(now);
    yesterday3.setDate(yesterday3.getDate() - 1); // Вчера
    yesterday3.setHours(18, 0, 0, 0); // 18:00 вчера

    const events = [
      {
        name: 'ТУРНІР ЧЕМПІОНІВ',
        image: '/uploads/event.png',
        startDate: pastDate1,
        endDate: new Date(pastDate1.getTime() + 2 * 60 * 60 * 1000), // +2 часа
        description:
          'ПРЕМІАЛЬНИЙ ТУРНІР ДЛЯ НАЙКРАЩИХ КОМАНД. ЗМАГАННЯ З ВИСОКИМИ СТАВКАМИ ТА ПРИЗОВИМ ФОНДОМ.',
        cityId: kyivCityId,
        address: 'ВУЛ. ХРЕЩАТИК, 1',
        maxParticipants: 16,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 500,
        isActive: true,
        isCompleted: true,
        completedAt: pastDate1,
      },
      {
        name: 'ТАКТИЧНА БІЙКА',
        image: '/uploads/event-2.jpg',
        startDate: pastDate2,
        endDate: new Date(pastDate2.getTime() + 2 * 60 * 60 * 1000),
        description:
          'ІНТЕНСИВНЕ ТРЕНУВАННЯ З ТАКТИКИ ТА СТРАТЕГІЇ. ДЛЯ ДОСВІДЧЕНИХ ГРАВЦІВ.',
        cityId: kyivCityId,
        address: 'ПР. ПЕРЕМОГИ, 10',
        maxParticipants: 12,
        competitionType: CompetitionType.INDIVIDUAL,
        paymentMethods: [PaymentMethod.BANK],
        price: 400,
        isActive: true,
        isCompleted: true,
        completedAt: pastDate2,
      },
      {
        name: 'КОМАНДНИЙ БОЙ',
        image: '/uploads/event.png',
        startDate: pastDate3,
        endDate: new Date(pastDate3.getTime() + 3 * 60 * 60 * 1000), // +3 часа
        description:
          'МАСШТАБНА КОМАНДНА ГРА З СКЛАДНИМИ СЦЕНАРІЯМИ. ІДЕАЛЬНО ДЛЯ КОМАНД, ЯКІ ХОЧУТЬ ПРОТЕСТУВАТИ СВОЇ НАВИЧКИ.',
        cityId: lvivCityId,
        address: 'ПР. СВОБОДИ, 15',
        maxParticipants: 20,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 450,
        isActive: true,
        isCompleted: true,
        completedAt: pastDate3,
      },
      // Незавершенные события для тестирования функции завершения
      {
        name: 'ВЕСНЯНИЙ ТУРНІР',
        image: '/uploads/event.png',
        startDate: pastDate4,
        endDate: new Date(pastDate4.getTime() + 3 * 60 * 60 * 1000),
        description:
          'ВЕЛИКИЙ ВЕСНЯНИЙ ТУРНІР ДЛЯ ВСІХ ОХОЧИХ. ЗМАГАННЯ З ПРИЗОВИМ ФОНДОМ ТА МЕДАЛЯМИ.',
        cityId: kyivCityId,
        address: 'ВУЛ. ШЕВЧЕНКА, 25',
        maxParticipants: 24,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 350,
        isActive: true,
        isCompleted: false, // НЕ завершено - для тестирования
      },
      {
        name: 'ІНДИВІДУАЛЬНІ ЗМАГАННЯ',
        image: '/uploads/event-2.jpg',
        startDate: pastDate5,
        endDate: new Date(pastDate5.getTime() + 2 * 60 * 60 * 1000),
        description:
          'ІНДИВІДУАЛЬНІ ЗМАГАННЯ ДЛЯ СТРАЙКБОЛІСТІВ. КОЖЕН ГРАВЕЦЬ ЗМАГАЄТЬСЯ ЗА ОСОБИСТИЙ РЕЙТИНГ.',
        cityId: kyivCityId,
        address: 'ПР. ПЕРЕМОГИ, 5',
        maxParticipants: 16,
        competitionType: CompetitionType.INDIVIDUAL,
        paymentMethods: [PaymentMethod.BANK],
        price: 300,
        isActive: true,
        isCompleted: false, // НЕ завершено - для тестирования
      },
      {
        name: 'ШВИДКА ГРА',
        image: '/uploads/event.png',
        startDate: pastDate6,
        endDate: new Date(pastDate6.getTime() + 1.5 * 60 * 60 * 1000),
        description:
          'ШВИДКА ДИНАМІЧНА ГРА ДЛЯ КОМАНД. КОРОТКІ РАУНДИ З ІНТЕНСИВНИМИ БОЙОВИМИ ДІЯМИ.',
        cityId: lvivCityId,
        address: 'ВУЛ. ГОРІХОВА, 8',
        maxParticipants: 18,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.CASH],
        price: 250,
        isActive: true,
        isCompleted: false, // НЕ завершено - для тестирования
      },
      // Дополнительные незавершенные события для тестирования
      {
        name: 'НОЧНА БІЙКА',
        image: '/uploads/event.png',
        startDate: pastDate7,
        endDate: new Date(pastDate7.getTime() + 4 * 60 * 60 * 1000),
        description:
          'НОЧНА ГРА З ОСВІТЛЕННЯМ. УНІКАЛЬНИЙ ДОСВІД ГРИ В ТЕМРІ З ТАКТИЧНИМИ ФОНАРИКАМИ.',
        cityId: kyivCityId,
        address: 'ВУЛ. ВОЛОДИМИРСЬКА, 40',
        maxParticipants: 16,
        competitionType: CompetitionType.INDIVIDUAL,
        paymentMethods: [PaymentMethod.BANK],
        price: 350,
        isActive: true,
        isCompleted: false, // НЕ завершено - для тестирования
      },
      {
        name: 'ТУРНІР НОВАЧКІВ',
        image: '/uploads/event-2.jpg',
        startDate: pastDate8,
        endDate: new Date(pastDate8.getTime() + 3 * 60 * 60 * 1000),
        description:
          'ТУРНІР ДЛЯ НОВИХ ГРАВЦІВ. ІДЕАЛЬНА МОЖЛИВІСТЬ СПРОБУВАТИ СЕБЕ В СТРАЙКБОЛІ.',
        cityId: kyivCityId,
        address: 'ПР. ПЕРЕМОГИ, 20',
        maxParticipants: 20,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 200,
        isActive: true,
        isCompleted: false, // НЕ завершено - для тестирования
      },
      {
        name: 'МАЙБУТНЯ БІЙКА',
        image: '/uploads/event.png',
        startDate: futureDate1,
        endDate: new Date(futureDate1.getTime() + 2 * 60 * 60 * 1000),
        description:
          'МАЙБУТНЯ ГРА ДЛЯ ВСІХ ОХОЧИХ. ЗАРЕЄСТРУЙТЕСЬ ЗАЗДАЛЕГІДЬ.',
        cityId: kyivCityId,
        address: 'ВУЛ. ХРЕЩАТИК, 10',
        maxParticipants: 24,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK],
        price: 400,
        isActive: true,
        isCompleted: false, // НЕ завершено - будущее событие
      },
      {
        name: 'ВЕЛИКИЙ ТУРНІР',
        image: '/uploads/event-2.jpg',
        startDate: futureDate2,
        endDate: new Date(futureDate2.getTime() + 5 * 60 * 60 * 1000),
        description:
          'ВЕЛИКИЙ ТУРНІР З ПРИЗОВИМ ФОНДОМ. ЗМАГАННЯ ДЛЯ НАЙКРАЩИХ КОМАНД.',
        cityId: lvivCityId,
        address: 'ПР. СВОБОДИ, 25',
        maxParticipants: 32,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 600,
        isActive: true,
        isCompleted: false, // НЕ завершено - будущее событие
      },
      // Еще 4 незавершенных события для тестирования
      {
        name: 'СПІЛЬНА ГРА',
        image: '/uploads/event.png',
        startDate: pastDate9,
        endDate: new Date(pastDate9.getTime() + 2.5 * 60 * 60 * 1000),
        description:
          'СПІЛЬНА ГРА ДЛЯ ВСІХ ОХОЧИХ. ДИНАМІЧНІ СЦЕНАРІЇ ТА КОМАНДНА ВЗАЄМОДІЯ.',
        cityId: kyivCityId,
        address: 'ВУЛ. БАНКОВА, 5',
        maxParticipants: 20,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 280,
        isActive: true,
        isCompleted: false, // НЕ завершено - для тестирования
      },
      {
        name: 'ТАКТИЧНА АКАДЕМІЯ',
        image: '/uploads/event-2.jpg',
        startDate: pastDate10,
        endDate: new Date(pastDate10.getTime() + 3 * 60 * 60 * 1000),
        description:
          'ТРЕНУВАННЯ ДЛЯ ПОКРАЩЕННЯ НАВИЧОК. ІНСТРУКТОРИ ДОПОМОЖУТЬ ОПАНУВАТИ НОВІ ТЕХНІКИ.',
        cityId: kyivCityId,
        address: 'ПР. ПЕРЕМОГИ, 15',
        maxParticipants: 14,
        competitionType: CompetitionType.INDIVIDUAL,
        paymentMethods: [PaymentMethod.BANK],
        price: 320,
        isActive: true,
        isCompleted: false, // НЕ завершено - для тестирования
      },
      {
        name: 'ЕКСПРЕС БІЙКА',
        image: '/uploads/event.png',
        startDate: pastDate11,
        endDate: new Date(pastDate11.getTime() + 1 * 60 * 60 * 1000),
        description:
          'ШВИДКА ЕКСПРЕС ГРА. КОРОТКІ РАУНДИ З МАКСИМАЛЬНОЮ ІНТЕНСИВНІСТЮ.',
        cityId: lvivCityId,
        address: 'ВУЛ. ГОРІХОВА, 12',
        maxParticipants: 16,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.CASH],
        price: 220,
        isActive: true,
        isCompleted: false, // НЕ завершено - для тестирования
      },
      {
        name: 'ВЕСНЯНІ ЗМАГАННЯ',
        image: '/uploads/event-2.jpg',
        startDate: futureDate3,
        endDate: new Date(futureDate3.getTime() + 4 * 60 * 60 * 1000),
        description:
          'ВЕСНЯНІ ЗМАГАННЯ ДЛЯ ВСІХ РІВНІВ. ВІД НОВАЧКІВ ДО ПРОФЕСІОНАЛІВ.',
        cityId: kyivCityId,
        address: 'ВУЛ. ХРЕЩАТИК, 15',
        maxParticipants: 28,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 380,
        isActive: true,
        isCompleted: false, // НЕ завершено - будущее событие
      },
      // События, которые закончились вчера, но еще не завершены
      {
        name: 'РАНКОВА БІЙКА',
        image: '/uploads/event.png',
        startDate: yesterday1,
        endDate: new Date(yesterday1.getTime() + 2 * 60 * 60 * 1000), // Закончилось вчера в 12:00
        description:
          'РАНКОВА ГРА ДЛЯ АКТИВНИХ ГРАВЦІВ. ПОЧАТОК ДНЯ З АДРЕНАЛІНОМ.',
        cityId: kyivCityId,
        address: 'ВУЛ. ХРЕЩАТИК, 8',
        maxParticipants: 18,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 300,
        isActive: true,
        isCompleted: false, // НЕ завершено - закончилось вчера, но кнопка еще не нажата
      },
      {
        name: 'ДЕННА ГРА',
        image: '/uploads/event-2.jpg',
        startDate: yesterday2,
        endDate: new Date(yesterday2.getTime() + 3 * 60 * 60 * 1000), // Закончилось вчера в 17:00
        description:
          'ДЕННА ГРА З ІНТЕНСИВНИМИ БОЙОВИМИ ДІЯМИ. ІДЕАЛЬНО ДЛЯ ДОСВІДЧЕНИХ ГРАВЦІВ.',
        cityId: kyivCityId,
        address: 'ПР. ПЕРЕМОГИ, 8',
        maxParticipants: 22,
        competitionType: CompetitionType.INDIVIDUAL,
        paymentMethods: [PaymentMethod.BANK],
        price: 350,
        isActive: true,
        isCompleted: false, // НЕ завершено - закончилось вчера, но кнопка еще не нажата
      },
      {
        name: 'ВЕЧІРНЯ БІЙКА',
        image: '/uploads/event.png',
        startDate: yesterday3,
        endDate: new Date(yesterday3.getTime() + 2.5 * 60 * 60 * 1000), // Закончилось вчера в 20:30
        description:
          'ВЕЧІРНЯ ГРА З ОСВІТЛЕННЯМ. УНІКАЛЬНИЙ ДОСВІД ГРИ В СУТІНКАХ.',
        cityId: lvivCityId,
        address: 'ПР. СВОБОДИ, 20',
        maxParticipants: 16,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 320,
        isActive: true,
        isCompleted: false, // НЕ завершено - закончилось вчера, но кнопка еще не нажата
      },
    ];

    const defaultSides = [
      { name: 'Side A', orderIndex: 0 },
      { name: 'Side B', orderIndex: 1 },
    ];
    const defaultRatingGameType = await prisma.ratingGameType.upsert({
      where: { name: 'Базовий' },
      update: {},
      create: {
        name: 'Базовий',
        playerPoints: 0,
        teamWinPoints: 0,
        teamParticipatedPoints: 0,
        organizerPointsPerParticipant: 0,
      },
    });

    // Удаляем старые события этой организации (опционально, для чистоты)
    const existingEvents = await prisma.event.findMany({
      where: { applicationId: application.id },
      select: { id: true },
    });

    if (existingEvents.length > 0) {
      console.log(
        `ℹ️  Found ${existingEvents.length} existing events for this application`,
      );
    }

    // Создаем события (используем create, так как у нас нет уникального поля для upsert)
    const createdEvents = await Promise.all(
      events.map((event) =>
        prisma.event.create({
          data: {
            ...event,
            gameStartDate: event.startDate,
            applicationId: application.id,
            ratingGameTypeId: defaultRatingGameType.id,
            sides: { create: defaultSides },
          },
        }),
      ),
    );

    console.log(`✅ Created/updated ${createdEvents.length} events`);

    // Создаем регистрации для событий
    let registrationsCreated = 0;

    // Получаем пользователей и команды для регистрации
    const allUsers = await prisma.user.findMany({
      take: 20,
    });

    const allTeams = await prisma.team.findMany({
      take: 10,
    });

    for (const event of createdEvents) {
      const eventSides = await prisma.eventSide.findMany({
        where: { eventId: event.id },
        orderBy: { orderIndex: 'asc' },
      });
      const firstSide = eventSides[0];

      if (
        event.competitionType === CompetitionType.TEAM &&
        allTeams.length > 0
      ) {
        // Для командных событий регистрируем команды
        const teamsToRegister = allTeams.slice(0, Math.min(4, allTeams.length));
        for (const team of teamsToRegister) {
          const captain = await prisma.teamMember.findFirst({
            where: {
              teamId: team.id,
              memberStatus: 'ACTIVE',
            },
            include: { user: true },
          });

          if (captain?.user) {
            try {
              await prisma.eventRegistration.upsert({
                where: {
                  eventId_userId: {
                    eventId: event.id,
                    userId: captain.user.id,
                  },
                },
                create: {
                  eventId: event.id,
                  userId: captain.user.id,
                  teamId: team.id,
                  eventSideId: firstSide?.id,
                  status: EventRegistrationStatus.APPROVED,
                },
                update: {
                  status: EventRegistrationStatus.APPROVED,
                },
              });
              registrationsCreated++;
            } catch {
              // Игнорируем дубликаты
            }
          }
        }
      } else if (
        event.competitionType === CompetitionType.INDIVIDUAL &&
        allUsers.length > 0
      ) {
        // Для индивидуальных событий регистрируем пользователей
        const usersToRegister = allUsers.slice(0, Math.min(8, allUsers.length));
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
                eventSideId: firstSide?.id,
                status: EventRegistrationStatus.APPROVED,
              },
              update: {
                status: EventRegistrationStatus.APPROVED,
              },
            });
            registrationsCreated++;
          } catch {
            // Игнорируем дубликаты
          }
        }
      }
    }

    if (registrationsCreated > 0) {
      console.log(`✅ Created ${registrationsCreated} registrations`);
    }

    // Создаем результаты событий для пользователя owner
    console.log('🎯 Creating event results for owner...');
    let resultsCreated = 0;

    // Формула расчета очков (та же, что в EventResultsService)
    const POINTS_BY_PLACEMENT = {
      [EventPlacement.FIRST]: 100,
      [EventPlacement.SECOND]: 75,
      [EventPlacement.THIRD]: 50,
      [EventPlacement.PARTICIPATED]: 25,
    };

    const KILL_BONUS = 2;
    const ACCURACY_BONUS_MULTIPLIER = 0.5;

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

    // Получаем завершенные события
    const completedEvents = createdEvents.filter((e) => {
      const eventData = events.find((ev) => ev.name === e.name);
      return eventData?.isCompleted === true;
    });

    // Создаем регистрации для owner на завершенные события, если их еще нет
    for (const event of completedEvents) {
      const eventSides = await prisma.eventSide.findMany({
        where: { eventId: event.id },
        orderBy: { orderIndex: 'asc' },
      });
      const firstSide = eventSides[0];

      // Регистрируем owner на событие
      try {
        await prisma.eventRegistration.upsert({
          where: {
            eventId_userId: {
              eventId: event.id,
              userId: owner.id,
            },
          },
          create: {
            eventId: event.id,
            userId: owner.id,
            eventSideId: firstSide?.id,
            status: EventRegistrationStatus.APPROVED,
          },
          update: {
            status: EventRegistrationStatus.APPROVED,
          },
        });
      } catch {
        // Игнорируем дубликаты
      }

      // Создаем результат для owner
      // Проверяем, не существует ли уже результат
      const existingResult = await prisma.eventResult.findFirst({
        where: {
          eventId: event.id,
          userId: owner.id,
        },
      });

      if (existingResult) {
        continue; // Пропускаем, если результат уже существует
      }

      // Определяем место в зависимости от типа события
      let placement: EventPlacement;
      let kills: number;
      let deaths: number;
      let accuracy: number;

      if (event.competitionType === CompetitionType.INDIVIDUAL) {
        // Для индивидуальных событий - случайное место с хорошими шансами на победу
        const rand = Math.random();
        if (rand < 0.3) {
          placement = EventPlacement.FIRST;
          kills = Math.floor(Math.random() * 10) + 20; // 20-30 убийств
          deaths = Math.floor(Math.random() * 5) + 3; // 3-8 смертей
          accuracy = Math.random() * 10 + 80; // 80-90% точность
        } else if (rand < 0.6) {
          placement = EventPlacement.SECOND;
          kills = Math.floor(Math.random() * 8) + 15; // 15-23 убийств
          deaths = Math.floor(Math.random() * 6) + 5; // 5-11 смертей
          accuracy = Math.random() * 10 + 75; // 75-85% точность
        } else if (rand < 0.8) {
          placement = EventPlacement.THIRD;
          kills = Math.floor(Math.random() * 8) + 12; // 12-20 убийств
          deaths = Math.floor(Math.random() * 7) + 6; // 6-13 смертей
          accuracy = Math.random() * 10 + 70; // 70-80% точность
        } else {
          placement = EventPlacement.PARTICIPATED;
          kills = Math.floor(Math.random() * 8) + 8; // 8-16 убийств
          deaths = Math.floor(Math.random() * 8) + 8; // 8-16 смертей
          accuracy = Math.random() * 10 + 65; // 65-75% точность
        }
      } else {
        // Для командных событий - создаем индивидуальный результат для owner
        // (статистика игрока считается по индивидуальным результатам)
        const rand = Math.random();
        if (rand < 0.3) {
          placement = EventPlacement.FIRST;
          kills = Math.floor(Math.random() * 10) + 20;
          deaths = Math.floor(Math.random() * 5) + 3;
          accuracy = Math.random() * 10 + 80;
        } else if (rand < 0.6) {
          placement = EventPlacement.SECOND;
          kills = Math.floor(Math.random() * 8) + 15;
          deaths = Math.floor(Math.random() * 6) + 5;
          accuracy = Math.random() * 10 + 75;
        } else if (rand < 0.8) {
          placement = EventPlacement.THIRD;
          kills = Math.floor(Math.random() * 8) + 12;
          deaths = Math.floor(Math.random() * 7) + 6;
          accuracy = Math.random() * 10 + 70;
        } else {
          placement = EventPlacement.PARTICIPATED;
          kills = Math.floor(Math.random() * 8) + 10;
          deaths = Math.floor(Math.random() * 8) + 8;
          accuracy = Math.random() * 10 + 70;
        }
      }

      // Всегда создаем индивидуальный результат для owner
      // (для статистики игрока нужны индивидуальные результаты)
      {
        const points = calculatePoints(placement, kills, accuracy);

        await prisma.eventResult.create({
          data: {
            eventId: event.id,
            userId: owner.id,
            placement,
            points,
            kills,
            deaths,
            accuracy: new Prisma.Decimal(accuracy.toFixed(2)),
            status: EventResultStatus.CONFIRMED,
            confirmedAt: event.completedAt || new Date(),
            confirmedBy: owner.id,
          },
        });

        resultsCreated++;
      }
    }

    if (resultsCreated > 0) {
      console.log(`✅ Created ${resultsCreated} event results for owner`);
    } else {
      console.log(
        `⚠️  No results created for owner. This might be because events are not completed or owner is not registered.`,
      );
    }

    // Пересчитываем статистику owner на основе всех подтвержденных результатов
    console.log('📊 Recalculating owner statistics...');

    // Получаем только индивидуальные результаты owner (userId должен быть установлен)
    const ownerIndividualResults = await prisma.eventResult.findMany({
      where: {
        userId: owner.id,
        status: EventResultStatus.CONFIRMED,
      },
    });

    console.log(
      `   Found ${ownerIndividualResults.length} individual results for owner (userId: ${owner.id})`,
    );

    // Выводим детали результатов для отладки
    if (ownerIndividualResults.length > 0) {
      console.log('   Results details:');
      ownerIndividualResults.forEach((r, i) => {
        console.log(
          `     ${i + 1}. EventId: ${r.eventId}, Placement: ${r.placement}, Points: ${r.points}, Kills: ${r.kills ?? 'null'}, Deaths: ${r.deaths ?? 'null'}, Accuracy: ${r.accuracy?.toNumber() ?? 'N/A'}`,
        );
      });
    } else {
      console.log(
        `   ⚠️  No individual results found! Checking all results for owner...`,
      );
      const allOwnerResults = await prisma.eventResult.findMany({
        where: {
          OR: [{ userId: owner.id }, { confirmedBy: owner.id }],
        },
      });
      console.log(
        `   Found ${allOwnerResults.length} total results (including team results)`,
      );
      allOwnerResults.forEach((r) => {
        console.log(
          `     - EventId: ${r.eventId}, UserId: ${r.userId ?? 'null'}, TeamId: ${r.teamId ?? 'null'}, Status: ${r.status}`,
        );
      });
    }

    if (ownerIndividualResults.length > 0) {
      const ownerResults = ownerIndividualResults;
      // Подсчитываем статистику с нуля
      let gamesPlayed = 0;
      let wins = 0;
      let losses = 0;
      let draws = 0;
      let totalPoints = 0;
      let totalKills = 0;
      let totalDeaths = 0;
      let totalAccuracy = 0;
      let accuracyCount = 0;

      for (const result of ownerResults) {
        gamesPlayed++;
        totalPoints += result.points;

        if (result.placement === EventPlacement.FIRST) {
          wins++;
        } else if (
          result.placement === EventPlacement.SECOND ||
          result.placement === EventPlacement.THIRD
        ) {
          losses++;
        } else {
          draws++;
        }

        if (result.kills !== null) {
          totalKills += result.kills;
        }
        if (result.deaths !== null) {
          totalDeaths += result.deaths;
        }
        if (result.accuracy !== null) {
          totalAccuracy += result.accuracy.toNumber();
          accuracyCount++;
        }
      }

      const averagePoints = gamesPlayed > 0 ? totalPoints / gamesPlayed : 0;
      const winRate = gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0;
      const averageAccuracy =
        accuracyCount > 0 ? totalAccuracy / accuracyCount : null;
      // K/D ratio рассчитываем как общее количество kills / общее количество deaths
      const kdRatio =
        totalDeaths > 0
          ? totalKills / totalDeaths
          : totalKills > 0
            ? totalKills
            : null;

      // Обновляем статистику игрока
      const statsData = {
        gamesPlayed,
        wins,
        losses,
        draws,
        points: ownerResults[ownerResults.length - 1]?.points || 0,
        totalPoints,
        averagePoints: new Prisma.Decimal(averagePoints),
        accuracy: averageAccuracy ? new Prisma.Decimal(averageAccuracy) : null,
        kdRatio: kdRatio ? new Prisma.Decimal(kdRatio) : null,
        winRate: new Prisma.Decimal(winRate),
      };

      await prisma.playerStats.upsert({
        where: { userId: owner.id },
        create: {
          userId: owner.id,
          ...statsData,
        },
        update: statsData,
      });

      console.log(
        `✅ Updated owner statistics: ${gamesPlayed} games, ${wins} wins, ${averageAccuracy?.toFixed(1) ?? 'N/A'}% accuracy, ${kdRatio?.toFixed(2) ?? 'N/A'} K/D`,
      );
      console.log(
        `   Details: totalPoints=${totalPoints}, totalKills=${totalKills}, totalDeaths=${totalDeaths}`,
      );

      // Проверяем, что статистика действительно сохранена
      const savedStats = await prisma.playerStats.findUnique({
        where: { userId: owner.id },
      });
      if (savedStats) {
        console.log(
          `   ✅ Verified: Stats saved in DB - gamesPlayed=${savedStats.gamesPlayed}, wins=${savedStats.wins}, accuracy=${savedStats.accuracy?.toNumber() ?? 'null'}, kdRatio=${savedStats.kdRatio?.toNumber() ?? 'null'}`,
        );
      } else {
        console.log(`   ⚠️  Warning: Stats not found in DB after update!`);
      }
    } else {
      console.log(
        `   ⚠️  No results found for owner, statistics will remain at 0`,
      );
    }

    // Подсчитываем завершенные и незавершенные события
    const completedEventsSummary = createdEvents.filter((e) => {
      const eventData = events.find((ev) => ev.name === e.name);
      return eventData?.isCompleted === true;
    });
    const incompleteEvents = createdEvents.filter((e) => {
      const eventData = events.find((ev) => ev.name === e.name);
      return eventData?.isCompleted !== true;
    });

    console.log(`📧 Login credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   Application: ${application.name} (${application.uid})`);
    console.log(`\n📊 Events summary:`);
    console.log(`   Total events: ${createdEvents.length}`);
    console.log(`   Completed: ${completedEventsSummary.length}`);
    console.log(`   Incomplete: ${incompleteEvents.length}`);
    console.log(`\n📅 Incomplete events (visible in "Страйкбольні ігри" tab):`);
    incompleteEvents.forEach((e) => {
      const eventData = events.find((ev) => ev.name === e.name);
      const startDate = eventData?.startDate
        ? new Date(eventData.startDate)
        : new Date();
      console.log(`   - ${e.name} (${startDate.toLocaleDateString('uk-UA')})`);
    });
    console.log(`\n🎯 You can now log in and manage ratings for these events!`);
  } catch (error) {
    console.error('Error while seeding event owner:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end().catch(() => undefined);
  }
}

void seedEventOwner();
