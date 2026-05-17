import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../generated/prisma-client';
import { DATABASE_URL } from '../utils/config';

const REGIONS: Array<{ name: string; slug: string }> = [
  { name: 'Вінницька область', slug: 'vinnicka-oblast' },
  { name: 'Волинська область', slug: 'volinska-oblast' },
  { name: 'Дніпропетровська область', slug: 'dnipropetrovska-oblast' },
  { name: 'Донецька область', slug: 'donecka-oblast' },
  { name: 'Житомирська область', slug: 'zhitomirska-oblast' },
  { name: 'Закарпатська область', slug: 'zakarpatska-oblast' },
  { name: 'Запорізька область', slug: 'zaporizka-oblast' },
  { name: 'Івано-Франківська область', slug: 'ivano-frankivska-oblast' },
  { name: 'Київська область', slug: 'kiivska-oblast' },
  { name: 'Кіровоградська область', slug: 'kirovogradska-oblast' },
  { name: 'Луганська область', slug: 'luganska-oblast' },
  { name: 'Львівська область', slug: 'lvivska-oblast' },
  { name: 'Миколаївська область', slug: 'mikolaivska-oblast' },
  { name: 'Одеська область', slug: 'odeska-oblast' },
  { name: 'Полтавська область', slug: 'poltavska-oblast' },
  { name: 'Рівненська область', slug: 'rivnenska-oblast' },
  { name: 'Сумська область', slug: 'sumska-oblast' },
  { name: 'Тернопільська область', slug: 'ternopilska-oblast' },
  { name: 'Харківська область', slug: 'harkivska-oblast' },
  { name: 'Херсонська область', slug: 'hersonska-oblast' },
  { name: 'Хмельницька область', slug: 'hmelnicka-oblast' },
  { name: 'Черкаська область', slug: 'cherkaska-oblast' },
  { name: 'Чернівецька область', slug: 'chernivecka-oblast' },
  { name: 'Чернігівська область', slug: 'chernigivska-oblast' },
  { name: 'м. Київ', slug: 'kyiv-city' },
  { name: 'Автономна Республіка Крим', slug: 'avtonomna-respublika-krim' },
];

const pool = new Pool({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function seedRegions() {
  try {
    const { count } = await prisma.region.createMany({
      data: REGIONS,
      skipDuplicates: true,
    });
    console.log(`Regions: ${count}`);
  } finally {
    await prisma.$disconnect();
    await pool.end().catch(() => undefined);
  }
}

void seedRegions();
