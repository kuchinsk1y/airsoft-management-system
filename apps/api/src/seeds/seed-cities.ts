import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../generated/prisma-client';
import { DATABASE_URL } from '../utils/config';
import { regionSlugForCityName } from '../cities/city-region-slug';
import { generateSlug } from '../utils/slug';

const pool = new Pool({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function seedCities() {
  try {
    const defaultCities = [{ name: 'Львів' }, { name: 'Івано-Франківськ' }];

    for (const cityData of defaultCities) {
      const slug = generateSlug(cityData.name);

      const existingCity = await prisma.city.findFirst({
        where: {
          OR: [{ name: cityData.name }, { slug }],
        },
      });

      if (!existingCity) {
        const regionSlug = regionSlugForCityName(cityData.name) ?? 'vinnicka-oblast';
        const region = await prisma.region.findUnique({
          where: { slug: regionSlug },
        });
        if (!region) {
          throw new Error(`Region not found for slug: ${regionSlug}`);
        }
        await prisma.city.create({
          data: {
            name: cityData.name,
            slug,
            regionId: region.id,
          },
        });
        console.log(`City created: ${cityData.name}`);
      } else {
        console.log(`City already exists: ${cityData.name}`);
      }
    }

    console.log('Cities seeding completed successfully');
  } catch (error) {
    console.error('Error while seeding cities:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end().catch(() => undefined);
  }
}

void seedCities();
