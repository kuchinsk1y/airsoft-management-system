import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import {
  CompetitionType,
  PaymentMethod,
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

async function seedEvents() {
  try {
    let application = await prisma.application.findFirst({
      where: { name: 'Strike Shop' },
    });

    if (!application) {
      const ownerPassword = await bcrypt.hash('Passw0rd!', 10);
      const owner = await prisma.user.create({
        data: {
          email: 'shopstrike45@gmail.com',
          nickName: 'StrikeShop',
          fullName: 'Strike Shop',
          city: 'Київ',
          password: ownerPassword,
          dateOfBirth: new Date('1990-01-01'),
          country: 'UA',
          isVerified: true,
        },
      });

      application = await prisma.application.create({
        data: {
          uid: randomUUID(),
          name: 'Strike Shop',
          address: 'Київ, Україна',
          phoneNumber: '+380671112233',
          description: 'Організатор страйкбольних подій',
          ownerId: owner.id,
        },
      });
    }

    const events = [
      {
        name: 'СПІЛЬНА ГРА',
        image: '/uploads/event.png',
        startDate: new Date('2026-12-25T10:00:00'),
        endDate: new Date('2026-12-25T12:00:00'),
        description:
          'ДИНАМІЧНА КОМАНДНА ГРА ДЛЯ ВСІХ ОХОЧИХ. УЧАСНИКИ РОЗДІЛЯТЬСЯ НА КОМАНДИ ТА ЗМАГАТИМУТЬСЯ У ЗАХОПЛЮЮЧИХ СЦЕНАРІЯХ. ІДЕАЛЬНО ПІДІЙДЕ ДЛЯ ТИХ, ХТО ХОЧЕ ОТРИМАТИ МАКСИМУМ ЕМОЦІЙ ТА АДРЕНАЛІНУ В КОМАНДІ ОДНОДУМЦІВ.',
        city: 'Київ',
        address: 'ВУЛ. ХРЕЩАТИК, 1',
        maxParticipants: 20,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 300,
        isActive: true,
      },
      {
        name: 'ТАКТИЧНА АКАДЕМІЯ',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-12-23T14:00:00'),
        endDate: new Date('2026-12-23T16:00:00'),
        description:
          'ЦЕ ТРЕНУВАННЯ ДОЗВОЛИТЬ УЧАСНИКАМ ВДОСКОНАЛИТИ СВОЇ НАВИЧКИ У СТРАЙКБОЛІ, ВКЛЮЧАЮЧИ СТРІЛЬБУ, ТАКТИЧНІ ПЕРЕМІЩЕННЯ ТА КОМАНДНУ ВЗАЄМОДІЮ. ПІД КЕРІВНИЦТВОМ ДОСВІДЧЕНИХ ІНСТРУКТОРІВ ГРАВЦІ ОПАНУЮТЬ НОВІ СТРАТЕГІЇ ТА ТЕХНІКИ.',
        city: 'Київ',
        address: 'ВУЛ. ПРИКОЛІЙНА, 2',
        maxParticipants: 22,
        competitionType: CompetitionType.TRAINING,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 280,
        isActive: true,
      },
      {
        name: 'КОРПОРАТИВНА ГРА',
        image: '/uploads/event.png',
        startDate: new Date('2026-12-25T10:00:00'),
        endDate: new Date('2026-12-25T12:00:00'),
        description:
          'СПЕЦІАЛЬНА ПРОГРАМА ДЛЯ КОЛЕКТИВІВ ТА КОМПАНІЙ. ІДЕАЛЬНИЙ СПОСІБ ЗМІЦНИТИ КОМАНДНИЙ ДУХ, РОЗВИТИ ЛІДЕРСЬКІ ЯКОСТІ ТА ОРГАНІЗУВАТИ НЕЗВИЧАЙНИЙ КОРПОРАТИВНИЙ ЗАХІД. ПРОФЕСІЙНІ ІНСТРУКТОРИ ДОПОМОЖУТЬ СТВОРИТИ НЕЗАБУТНІ ВРАЖЕННЯ.',
        city: 'Львів',
        address: 'ПР. СВОБОДИ, 15',
        maxParticipants: 25,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 350,
        isActive: true,
      },
      {
        name: 'ПРИВАТНА ГРА',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-12-26T14:00:00'),
        endDate: new Date('2026-12-26T16:00:00'),
        description:
          'ІНДИВІДУАЛЬНА ГРА ДЛЯ ТИХ, ХТО ПРЕДОЧИТАЄ ОСОБИСТИЙ ПІДХІД. МОЖЛИВІСТЬ ОПАНУВАТИ НАВИЧКИ СТРІЛЬБИ ТА ТАКТИКИ В ОСОБИСТОМУ РИТМІ. ІДЕАЛЬНО ДЛЯ ПОЧАТКІВЦІВ, ЯКІ ХОЧУТЬ ОТРИМАТИ МАКСИМУМ УВАГИ ТА ІНСТРУКЦІЙ.',
        city: 'Київ',
        address: 'ПР. ПЕРЕМОГИ, 10',
        maxParticipants: 15,
        competitionType: CompetitionType.INDIVIDUAL,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 250,
        isActive: true,
      },
      {
        name: 'ТУРНІР',
        image: '/uploads/event.png',
        startDate: new Date('2026-12-27T10:00:00'),
        endDate: new Date('2026-12-27T12:00:00'),
        description:
          'СЕРЙОЗНЕ ЗМАГАННЯ ДЛЯ ДОСВІДЧЕНИХ ГРАВЦІВ. КОМАНДИ ЗМАГАТИМУТЬСЯ ЗА ПЕРЕМОГУ В НАПРУЖЕНИХ МАТЧАХ. ПЕРЕМОЖЦІ ОТРИМАЮТЬ ПРИЗИ ТА ЗВАННЯ ЧЕМПІОНІВ. ВИМОГЛИВІ ПРАВИЛА ТА ПРОФЕСІЙНЕ СУДДІВСТВО ГАРАНТУЮТЬ ЧЕСНУ БОРОТЬБУ.',
        city: 'Одеса',
        address: 'ВУЛ. ДЕРИБАСІВСЬКА, 25',
        maxParticipants: 30,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 400,
        isActive: true,
      },
      {
        name: 'СПІЛЬНА ГРА',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-12-28T18:00:00'),
        endDate: new Date('2026-12-28T20:00:00'),
        description:
          'ВЕЧІРНЯ ГРА ДЛЯ ВСІХ ОХОЧИХ. УЧАСНИКИ РОЗДІЛЯТЬСЯ НА КОМАНДИ ТА ЗМАГАТИМУТЬСЯ У ЗАХОПЛЮЮЧИХ СЦЕНАРІЯХ. ІДЕАЛЬНО ПІДІЙДЕ ДЛЯ ТИХ, ХТО ХОЧЕ ОТРИМАТИ МАКСИМУМ ЕМОЦІЙ ТА АДРЕНАЛІНУ В КОМАНДІ ОДНОДУМЦІВ.',
        city: 'Київ',
        address: 'ВУЛ. ХРЕЩАТИК, 1',
        maxParticipants: 20,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 300,
        isActive: true,
      },
      {
        name: 'ТАКТИЧНА АКАДЕМІЯ',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-12-29T10:00:00'),
        endDate: new Date('2026-12-29T12:00:00'),
        description:
          'ЦЕ ТРЕНУВАННЯ ДОЗВОЛИТЬ УЧАСНИКАМ ВДОСКОНАЛИТИ СВОЇ НАВИЧКИ У СТРАЙКБОЛІ, ВКЛЮЧАЮЧИ СТРІЛЬБУ, ТАКТИЧНІ ПЕРЕМІЩЕННЯ ТА КОМАНДНУ ВЗАЄМОДІЮ. ПІД КЕРІВНИЦТВОМ ДОСВІДЧЕНИХ ІНСТРУКТОРІВ ГРАВЦІ ОПАНУЮТЬ НОВІ СТРАТЕГІЇ ТА ТЕХНІКИ.',
        city: 'Івано-Франківськ',
        address: 'ВУЛ. ГРУШЕВСЬКОГО, 21',
        maxParticipants: 22,
        competitionType: CompetitionType.TRAINING,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 280,
        isActive: true,
      },
      {
        name: 'КОРПОРАТИВНА ГРА',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-12-30T14:00:00'),
        endDate: new Date('2026-12-30T16:00:00'),
        description:
          'СПЕЦІАЛЬНА ПРОГРАМА ДЛЯ КОЛЕКТИВІВ ТА КОМПАНІЙ. ІДЕАЛЬНИЙ СПОСІБ ЗМІЦНИТИ КОМАНДНИЙ ДУХ, РОЗВИТИ ЛІДЕРСЬКІ ЯКОСТІ ТА ОРГАНІЗУВАТИ НЕЗВИЧАЙНИЙ КОРПОРАТИВНИЙ ЗАХІД. ПРОФЕСІЙНІ ІНСТРУКТОРИ ДОПОМОЖУТЬ СТВОРИТИ НЕЗАБУТНІ ВРАЖЕННЯ.',
        city: 'Київ',
        address: 'ВУЛ. ХРЕЩАТИК, 1',
        maxParticipants: 25,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 350,
        isActive: true,
      },
      {
        name: 'ПРИВАТНА ГРА',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-12-31T10:00:00'),
        endDate: new Date('2026-12-31T12:00:00'),
        description:
          'ІНДИВІДУАЛЬНА ГРА ДЛЯ ТИХ, ХТО ПРЕДОЧИТАЄ ОСОБИСТИЙ ПІДХІД. МОЖЛИВІСТЬ ОПАНУВАТИ НАВИЧКИ СТРІЛЬБИ ТА ТАКТИКИ В ОСОБИСТОМУ РИТМІ. ІДЕАЛЬНО ДЛЯ ПОЧАТКІВЦІВ, ЯКІ ХОЧУТЬ ОТРИМАТИ МАКСИМУМ УВАГИ ТА ІНСТРУКЦІЙ.',
        city: 'Львів',
        address: 'ВУЛ. ГОРОДОЦЬКА, 36',
        maxParticipants: 15,
        competitionType: CompetitionType.INDIVIDUAL,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 250,
        isActive: true,
      },
      {
        name: 'ТУРНІР',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-01-01T10:00:00'),
        endDate: new Date('2026-01-01T12:00:00'),
        description:
          'СЕРЙОЗНЕ ЗМАГАННЯ ДЛЯ ДОСВІДЧЕНИХ ГРАВЦІВ. КОМАНДИ ЗМАГАТИМУТЬСЯ ЗА ПЕРЕМОГУ В НАПРУЖЕНИХ МАТЧАХ. ПЕРЕМОЖЦІ ОТРИМАЮТЬ ПРИЗИ ТА ЗВАННЯ ЧЕМПІОНІВ. ВИМОГЛИВІ ПРАВИЛА ТА ПРОФЕСІЙНЕ СУДДІВСТВО ГАРАНТУЮТЬ ЧЕСНУ БОРОТЬБУ.',
        city: 'Київ',
        address: 'ВУЛ. ГРУШЕВСЬКОГО, 5',
        maxParticipants: 30,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 400,
        isActive: true,
      },
      {
        name: 'СПІЛЬНА ГРА',
        image: '/uploads/event.png',
        startDate: new Date('2026-01-01T18:00:00'),
        endDate: new Date('2026-01-01T20:00:00'),
        description:
          'ВЕЧІРНЯ ГРА ДЛЯ ВСІХ ОХОЧИХ. УЧАСНИКИ РОЗДІЛЯТЬСЯ НА КОМАНДИ ТА ЗМАГАТИМУТЬСЯ У ЗАХОПЛЮЮЧИХ СЦЕНАРІЯХ. ІДЕАЛЬНО ПІДІЙДЕ ДЛЯ ТИХ, ХТО ХОЧЕ ОТРИМАТИ МАКСИМУМ ЕМОЦІЙ ТА АДРЕНАЛІНУ В КОМАНДІ ОДНОДУМЦІВ.',
        city: 'Одеса',
        address: 'ПР. ШЕВЧЕНКА, 4',
        maxParticipants: 20,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 300,
        isActive: true,
      },
      {
        name: 'ТАКТИЧНА АКАДЕМІЯ',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-01-02T10:00:00'),
        endDate: new Date('2026-01-02T12:00:00'),
        description:
          'ЦЕ ТРЕНУВАННЯ ДОЗВОЛИТЬ УЧАСНИКАМ ВДОСКОНАЛИТИ СВОЇ НАВИЧКИ У СТРАЙКБОЛІ, ВКЛЮЧАЮЧИ СТРІЛЬБУ, ТАКТИЧНІ ПЕРЕМІЩЕННЯ ТА КОМАНДНУ ВЗАЄМОДІЮ. ПІД КЕРІВНИЦТВОМ ДОСВІДЧЕНИХ ІНСТРУКТОРІВ ГРАВЦІ ОПАНУЮТЬ НОВІ СТРАТЕГІЇ ТА ТЕХНІКИ.',
        city: 'Київ',
        address: 'ВУЛ. ПРИКОЛІЙНА, 2',
        maxParticipants: 22,
        competitionType: CompetitionType.TRAINING,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 280,
        isActive: true,
      },
      {
        name: 'КОРПОРАТИВНА ГРА',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-01-03T14:00:00'),
        endDate: new Date('2026-01-03T16:00:00'),
        description:
          'СПЕЦІАЛЬНА ПРОГРАМА ДЛЯ КОЛЕКТИВІВ ТА КОМПАНІЙ. ІДЕАЛЬНИЙ СПОСІБ ЗМІЦНИТИ КОМАНДНИЙ ДУХ, РОЗВИТИ ЛІДЕРСЬКІ ЯКОСТІ ТА ОРГАНІЗУВАТИ НЕЗВИЧАЙНИЙ КОРПОРАТИВНИЙ ЗАХІД. ПРОФЕСІЙНІ ІНСТРУКТОРИ ДОПОМОЖУТЬ СТВОРИТИ НЕЗАБУТНІ ВРАЖЕННЯ.',
        city: 'Івано-Франківськ',
        address: 'ВУЛ. НЕЗАЛЕЖНОСТІ, 7',
        maxParticipants: 25,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 350,
        isActive: true,
      },
      {
        name: 'ПРИВАТНА ГРА',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-01-04T10:00:00'),
        endDate: new Date('2026-01-04T12:00:00'),
        description:
          'ІНДИВІДУАЛЬНА ГРА ДЛЯ ТИХ, ХТО ПРЕДОЧИТАЄ ОСОБИСТИЙ ПІДХІД. МОЖЛИВІСТЬ ОПАНУВАТИ НАВИЧКИ СТРІЛЬБИ ТА ТАКТИКИ В ОСОБИСТОМУ РИТМІ. ІДЕАЛЬНО ДЛЯ ПОЧАТКІВЦІВ, ЯКІ ХОЧУТЬ ОТРИМАТИ МАКСИМУМ УВАГИ ТА ІНСТРУКЦІЙ.',
        city: 'Київ',
        address: 'ПР. ПЕРЕМОГИ, 10',
        maxParticipants: 15,
        competitionType: CompetitionType.INDIVIDUAL,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 250,
        isActive: true,
      },
      {
        name: 'ТУРНІР',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-01-05T10:00:00'),
        endDate: new Date('2026-01-05T12:00:00'),
        description:
          'СЕРЙОЗНЕ ЗМАГАННЯ ДЛЯ ДОСВІДЧЕНИХ ГРАВЦІВ. КОМАНДИ ЗМАГАТИМУТЬСЯ ЗА ПЕРЕМОГУ В НАПРУЖЕНИХ МАТЧАХ. ПЕРЕМОЖЦІ ОТРИМАЮТЬ ПРИЗИ ТА ЗВАННЯ ЧЕМПІОНІВ. ВИМОГЛИВІ ПРАВИЛА ТА ПРОФЕСІЙНЕ СУДДІВСТВО ГАРАНТУЮТЬ ЧЕСНУ БОРОТЬБУ.',
        city: 'Львів',
        address: 'ВУЛ. ЗЕЛЕНА, 12',
        maxParticipants: 30,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 400,
        isActive: true,
      },
      {
        name: 'СПІЛЬНА ГРА',
        image: '/uploads/event.png',
        startDate: new Date('2026-01-06T18:00:00'),
        endDate: new Date('2026-01-06T20:00:00'),
        description:
          'ВЕЧІРНЯ ГРА ДЛЯ ВСІХ ОХОЧИХ. УЧАСНИКИ РОЗДІЛЯТЬСЯ НА КОМАНДИ ТА ЗМАГАТИМУТЬСЯ У ЗАХОПЛЮЮЧИХ СЦЕНАРІЯХ. ІДЕАЛЬНО ПІДІЙДЕ ДЛЯ ТИХ, ХТО ХОЧЕ ОТРИМАТИ МАКСИМУМ ЕМОЦІЙ ТА АДРЕНАЛІНУ В КОМАНДІ ОДНОДУМЦІВ.',
        city: 'Київ',
        address: 'ВУЛ. ХРЕЩАТИК, 1',
        maxParticipants: 20,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 300,
        isActive: true,
      },
      {
        name: 'ТАКТИЧНА АКАДЕМІЯ',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-01-07T10:00:00'),
        endDate: new Date('2026-01-07T12:00:00'),
        description:
          'ЦЕ ТРЕНУВАННЯ ДОЗВОЛИТЬ УЧАСНИКАМ ВДОСКОНАЛИТИ СВОЇ НАВИЧКИ У СТРАЙКБОЛІ, ВКЛЮЧАЮЧИ СТРІЛЬБУ, ТАКТИЧНІ ПЕРЕМІЩЕННЯ ТА КОМАНДНУ ВЗАЄМОДІЮ. ПІД КЕРІВНИЦТВОМ ДОСВІДЧЕНИХ ІНСТРУКТОРІВ ГРАВЦІ ОПАНУЮТЬ НОВІ СТРАТЕГІЇ ТА ТЕХНІКИ.',
        city: 'Одеса',
        address: 'ВУЛ. ПРЕОБРАЖЕНСЬКА, 8',
        maxParticipants: 22,
        competitionType: CompetitionType.TRAINING,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 280,
        isActive: true,
      },
      {
        name: 'СПІЛЬНА ГРА',
        image: '/uploads/event.png',
        startDate: new Date('2026-01-08T10:00:00'),
        endDate: new Date('2026-01-08T12:00:00'),
        description:
          'ДИНАМІЧНА КОМАНДНА ГРА ДЛЯ ВСІХ ОХОЧИХ. УЧАСНИКИ РОЗДІЛЯТЬСЯ НА КОМАНДИ ТА ЗМАГАТИМУТЬСЯ У ЗАХОПЛЮЮЧИХ СЦЕНАРІЯХ. ІДЕАЛЬНО ПІДІЙДЕ ДЛЯ ТИХ, ХТО ХОЧЕ ОТРИМАТИ МАКСИМУМ ЕМОЦІЙ ТА АДРЕНАЛІНУ В КОМАНДІ ОДНОДУМЦІВ.',
        city: 'Київ',
        address: 'ВУЛ. ХРЕЩАТИК, 1',
        maxParticipants: 20,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 300,
        isActive: true,
      },
      {
        name: 'ТАКТИЧНА АКАДЕМІЯ',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-01-09T14:00:00'),
        endDate: new Date('2026-01-09T16:00:00'),
        description:
          'ЦЕ ТРЕНУВАННЯ ДОЗВОЛИТЬ УЧАСНИКАМ ВДОСКОНАЛИТИ СВОЇ НАВИЧКИ У СТРАЙКБОЛІ, ВКЛЮЧАЮЧИ СТРІЛЬБУ, ТАКТИЧНІ ПЕРЕМІЩЕННЯ ТА КОМАНДНУ ВЗАЄМОДІЮ. ПІД КЕРІВНИЦТВОМ ДОСВІДЧЕНИХ ІНСТРУКТОРІВ ГРАВЦІ ОПАНУЮТЬ НОВІ СТРАТЕГІЇ ТА ТЕХНІКИ.',
        city: 'Львів',
        address: 'ПР. СВОБОДИ, 15',
        maxParticipants: 22,
        competitionType: CompetitionType.TRAINING,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 280,
        isActive: true,
      },
      {
        name: 'КОРПОРАТИВНА ГРА',
        image: '/uploads/event.png',
        startDate: new Date('2026-01-10T10:00:00'),
        endDate: new Date('2026-01-10T12:00:00'),
        description:
          'СПЕЦІАЛЬНА ПРОГРАМА ДЛЯ КОЛЕКТИВІВ ТА КОМПАНІЙ. ІДЕАЛЬНИЙ СПОСІБ ЗМІЦНИТИ КОМАНДНИЙ ДУХ, РОЗВИТИ ЛІДЕРСЬКІ ЯКОСТІ ТА ОРГАНІЗУВАТИ НЕЗВИЧАЙНИЙ КОРПОРАТИВНИЙ ЗАХІД. ПРОФЕСІЙНІ ІНСТРУКТОРИ ДОПОМОЖУТЬ СТВОРИТИ НЕЗАБУТНІ ВРАЖЕННЯ.',
        city: 'Київ',
        address: 'ВУЛ. ХРЕЩАТИК, 1',
        maxParticipants: 25,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 350,
        isActive: true,
      },
      {
        name: 'ПРИВАТНА ГРА',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-01-11T14:00:00'),
        endDate: new Date('2026-01-11T16:00:00'),
        description:
          'ІНДИВІДУАЛЬНА ГРА ДЛЯ ТИХ, ХТО ПРЕДОЧИТАЄ ОСОБИСТИЙ ПІДХІД. МОЖЛИВІСТЬ ОПАНУВАТИ НАВИЧКИ СТРІЛЬБИ ТА ТАКТИКИ В ОСОБИСТОМУ РИТМІ. ІДЕАЛЬНО ДЛЯ ПОЧАТКІВЦІВ, ЯКІ ХОЧУТЬ ОТРИМАТИ МАКСИМУМ УВАГИ ТА ІНСТРУКЦІЙ.',
        city: 'Одеса',
        address: 'ВУЛ. ДЕРИБАСІВСЬКА, 25',
        maxParticipants: 15,
        competitionType: CompetitionType.INDIVIDUAL,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 250,
        isActive: true,
      },
      {
        name: 'ТУРНІР',
        image: '/uploads/event.png',
        startDate: new Date('2026-01-12T10:00:00'),
        endDate: new Date('2026-01-12T12:00:00'),
        description:
          'СЕРЙОЗНЕ ЗМАГАННЯ ДЛЯ ДОСВІДЧЕНИХ ГРАВЦІВ. КОМАНДИ ЗМАГАТИМУТЬСЯ ЗА ПЕРЕМОГУ В НАПРУЖЕНИХ МАТЧАХ. ПЕРЕМОЖЦІ ОТРИМАЮТЬ ПРИЗИ ТА ЗВАННЯ ЧЕМПІОНІВ. ВИМОГЛИВІ ПРАВИЛА ТА ПРОФЕСІЙНЕ СУДДІВСТВО ГАРАНТУЮТЬ ЧЕСНУ БОРОТЬБУ.',
        city: 'Івано-Франківськ',
        address: 'ВУЛ. ГРУШЕВСЬКОГО, 21',
        maxParticipants: 30,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 400,
        isActive: true,
      },
      {
        name: 'СПІЛЬНА ГРА',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-01-13T18:00:00'),
        endDate: new Date('2026-01-13T20:00:00'),
        description:
          'ВЕЧІРНЯ ГРА ДЛЯ ВСІХ ОХОЧИХ. УЧАСНИКИ РОЗДІЛЯТЬСЯ НА КОМАНДИ ТА ЗМАГАТИМУТЬСЯ У ЗАХОПЛЮЮЧИХ СЦЕНАРІЯХ. ІДЕАЛЬНО ПІДІЙДЕ ДЛЯ ТИХ, ХТО ХОЧЕ ОТРИМАТИ МАКСИМУМ ЕМОЦІЙ ТА АДРЕНАЛІНУ В КОМАНДІ ОДНОДУМЦІВ.',
        city: 'Київ',
        address: 'ПР. ПЕРЕМОГИ, 10',
        maxParticipants: 20,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 300,
        isActive: true,
      },
      {
        name: 'ТАКТИЧНА АКАДЕМІЯ',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-01-14T10:00:00'),
        endDate: new Date('2026-01-14T12:00:00'),
        description:
          'ЦЕ ТРЕНУВАННЯ ДОЗВОЛИТЬ УЧАСНИКАМ ВДОСКОНАЛИТИ СВОЇ НАВИЧКИ У СТРАЙКБОЛІ, ВКЛЮЧАЮЧИ СТРІЛЬБУ, ТАКТИЧНІ ПЕРЕМІЩЕННЯ ТА КОМАНДНУ ВЗАЄМОДІЮ. ПІД КЕРІВНИЦТВОМ ДОСВІДЧЕНИХ ІНСТРУКТОРІВ ГРАВЦІ ОПАНУЮТЬ НОВІ СТРАТЕГІЇ ТА ТЕХНІКИ.',
        city: 'Львів',
        address: 'ВУЛ. ГОРОДОЦЬКА, 36',
        maxParticipants: 22,
        competitionType: CompetitionType.TRAINING,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 280,
        isActive: true,
      },
      {
        name: 'КОРПОРАТИВНА ГРА',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-01-15T14:00:00'),
        endDate: new Date('2026-01-15T16:00:00'),
        description:
          'СПЕЦІАЛЬНА ПРОГРАМА ДЛЯ КОЛЕКТИВІВ ТА КОМПАНІЙ. ІДЕАЛЬНИЙ СПОСІБ ЗМІЦНИТИ КОМАНДНИЙ ДУХ, РОЗВИТИ ЛІДЕРСЬКІ ЯКОСТІ ТА ОРГАНІЗУВАТИ НЕЗВИЧАЙНИЙ КОРПОРАТИВНИЙ ЗАХІД. ПРОФЕСІЙНІ ІНСТРУКТОРИ ДОПОМОЖУТЬ СТВОРИТИ НЕЗАБУТНІ ВРАЖЕННЯ.',
        city: 'Одеса',
        address: 'ПР. ШЕВЧЕНКА, 4',
        maxParticipants: 25,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 350,
        isActive: true,
      },
      {
        name: 'ПРИВАТНА ГРА',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-01-16T10:00:00'),
        endDate: new Date('2026-01-16T12:00:00'),
        description:
          'ІНДИВІДУАЛЬНА ГРА ДЛЯ ТИХ, ХТО ПРЕДОЧИТАЄ ОСОБИСТИЙ ПІДХІД. МОЖЛИВІСТЬ ОПАНУВАТИ НАВИЧКИ СТРІЛЬБИ ТА ТАКТИКИ В ОСОБИСТОМУ РИТМІ. ІДЕАЛЬНО ДЛЯ ПОЧАТКІВЦІВ, ЯКІ ХОЧУТЬ ОТРИМАТИ МАКСИМУМ УВАГИ ТА ІНСТРУКЦІЙ.',
        city: 'Київ',
        address: 'ВУЛ. ГРУШЕВСЬКОГО, 5',
        maxParticipants: 15,
        competitionType: CompetitionType.INDIVIDUAL,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 250,
        isActive: true,
      },
      {
        name: 'ТУРНІР',
        image: '/uploads/event.png',
        startDate: new Date('2026-01-17T10:00:00'),
        endDate: new Date('2026-01-17T12:00:00'),
        description:
          'СЕРЙОЗНЕ ЗМАГАННЯ ДЛЯ ДОСВІДЧЕНИХ ГРАВЦІВ. КОМАНДИ ЗМАГАТИМУТЬСЯ ЗА ПЕРЕМОГУ В НАПРУЖЕНИХ МАТЧАХ. ПЕРЕМОЖЦІ ОТРИМАЮТЬ ПРИЗИ ТА ЗВАННЯ ЧЕМПІОНІВ. ВИМОГЛИВІ ПРАВИЛА ТА ПРОФЕСІЙНЕ СУДДІВСТВО ГАРАНТУЮТЬ ЧЕСНУ БОРОТЬБУ.',
        city: 'Львів',
        address: 'ВУЛ. ЗЕЛЕНА, 12',
        maxParticipants: 30,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 400,
        isActive: true,
      },
      {
        name: 'СПІЛЬНА ГРА',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-01-18T18:00:00'),
        endDate: new Date('2026-01-18T20:00:00'),
        description:
          'ВЕЧІРНЯ ГРА ДЛЯ ВСІХ ОХОЧИХ. УЧАСНИКИ РОЗДІЛЯТЬСЯ НА КОМАНДИ ТА ЗМАГАТИМУТЬСЯ У ЗАХОПЛЮЮЧИХ СЦЕНАРІЯХ. ІДЕАЛЬНО ПІДІЙДЕ ДЛЯ ТИХ, ХТО ХОЧЕ ОТРИМАТИ МАКСИМУМ ЕМОЦІЙ ТА АДРЕНАЛІНУ В КОМАНДІ ОДНОДУМЦІВ.',
        city: 'Одеса',
        address: 'ВУЛ. ПРЕОБРАЖЕНСЬКА, 8',
        maxParticipants: 20,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 300,
        isActive: true,
      },
      {
        name: 'ТАКТИЧНА АКАДЕМІЯ',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-01-19T10:00:00'),
        endDate: new Date('2026-01-19T12:00:00'),
        description:
          'ЦЕ ТРЕНУВАННЯ ДОЗВОЛИТЬ УЧАСНИКАМ ВДОСКОНАЛИТИ СВОЇ НАВИЧКИ У СТРАЙКБОЛІ, ВКЛЮЧАЮЧИ СТРІЛЬБУ, ТАКТИЧНІ ПЕРЕМІЩЕННЯ ТА КОМАНДНУ ВЗАЄМОДІЮ. ПІД КЕРІВНИЦТВОМ ДОСВІДЧЕНИХ ІНСТРУКТОРІВ ГРАВЦІ ОПАНУЮТЬ НОВІ СТРАТЕГІЇ ТА ТЕХНІКИ.',
        city: 'Київ',
        address: 'ВУЛ. ПРИКОЛІЙНА, 2',
        maxParticipants: 22,
        competitionType: CompetitionType.TRAINING,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 280,
        isActive: true,
      },
      {
        name: 'КОРПОРАТИВНА ГРА',
        image: '/uploads/event.png',
        startDate: new Date('2026-01-20T14:00:00'),
        endDate: new Date('2026-01-20T16:00:00'),
        description:
          'СПЕЦІАЛЬНА ПРОГРАМА ДЛЯ КОЛЕКТИВІВ ТА КОМПАНІЙ. ІДЕАЛЬНИЙ СПОСІБ ЗМІЦНИТИ КОМАНДНИЙ ДУХ, РОЗВИТИ ЛІДЕРСЬКІ ЯКОСТІ ТА ОРГАНІЗУВАТИ НЕЗВИЧАЙНИЙ КОРПОРАТИВНИЙ ЗАХІД. ПРОФЕСІЙНІ ІНСТРУКТОРИ ДОПОМОЖУТЬ СТВОРИТИ НЕЗАБУТНІ ВРАЖЕННЯ.',
        city: 'Івано-Франківськ',
        address: 'ВУЛ. НЕЗАЛЕЖНОСТІ, 7',
        maxParticipants: 25,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 350,
        isActive: true,
      },
      {
        name: 'ПРИВАТНА ГРА',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-01-21T10:00:00'),
        endDate: new Date('2026-01-21T12:00:00'),
        description:
          'ІНДИВІДУАЛЬНА ГРА ДЛЯ ТИХ, ХТО ПРЕДОЧИТАЄ ОСОБИСТИЙ ПІДХІД. МОЖЛИВІСТЬ ОПАНУВАТИ НАВИЧКИ СТРІЛЬБИ ТА ТАКТИКИ В ОСОБИСТОМУ РИТМІ. ІДЕАЛЬНО ДЛЯ ПОЧАТКІВЦІВ, ЯКІ ХОЧУТЬ ОТРИМАТИ МАКСИМУМ УВАГИ ТА ІНСТРУКЦІЙ.',
        city: 'Львів',
        address: 'ВУЛ. ГОРОДОЦЬКА, 36',
        maxParticipants: 15,
        competitionType: CompetitionType.INDIVIDUAL,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 250,
        isActive: true,
      },
      {
        name: 'ТУРНІР',
        image: '/uploads/event-2.jpg',
        startDate: new Date('2026-01-22T10:00:00'),
        endDate: new Date('2026-01-22T12:00:00'),
        description:
          'СЕРЙОЗНЕ ЗМАГАННЯ ДЛЯ ДОСВІДЧЕНИХ ГРАВЦІВ. КОМАНДИ ЗМАГАТИМУТЬСЯ ЗА ПЕРЕМОГУ В НАПРУЖЕНИХ МАТЧАХ. ПЕРЕМОЖЦІ ОТРИМАЮТЬ ПРИЗИ ТА ЗВАННЯ ЧЕМПІОНІВ. ВИМОГЛИВІ ПРАВИЛА ТА ПРОФЕСІЙНЕ СУДДІВСТВО ГАРАНТУЮТЬ ЧЕСНУ БОРОТЬБУ.',
        city: 'Київ',
        address: 'ВУЛ. ХРЕЩАТИК, 1',
        maxParticipants: 30,
        competitionType: CompetitionType.TEAM,
        paymentMethods: [PaymentMethod.BANK, PaymentMethod.CASH],
        price: 400,
        isActive: true,
      },
    ];

    const uniqueCities = Array.from(new Set(events.map((event) => event.city)));
    const cityMap = new Map<string, number>();
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

    for (const cityName of uniqueCities) {
      const cityId = await getOrCreateCity(cityName);
      cityMap.set(cityName, cityId);
    }

    const eventsWithCityId = events.map((event) => {
      const { city, ...rest } = event;
      return {
        ...rest,
        gameStartDate: rest.startDate,
        cityId: cityMap.get(city)!,
      };
    });

    await prisma.eventSide.deleteMany({});
    await prisma.event.deleteMany({});
    await prisma.eventRegistration.deleteMany({});

    const defaultSides = [
      { name: 'Side A', orderIndex: 0 },
      { name: 'Side B', orderIndex: 1 },
    ];

    const createdEvents = await Promise.all(
      eventsWithCityId.map((event) =>
        prisma.event.create({
          data: {
            ...event,
            applicationId: application.id,
            ratingGameTypeId: defaultRatingGameType.id,
            sides: { create: defaultSides },
          },
        }),
      ),
    );

    console.log(`Created ${createdEvents.length} events successfully`);
    console.log(`Application: ${application.name} (${application.uid})`);
  } catch (error) {
    console.error('Error while seeding events:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end().catch(() => undefined);
  }
}

void seedEvents();
