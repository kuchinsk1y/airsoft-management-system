import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { PrismaClient } from '../generated/prisma-client';
import { DATABASE_URL } from '../utils/config';
import { regionSlugForCityName } from '../cities/city-region-slug';
import { generateSlug } from '../utils/slug';

const pool = new Pool({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function getOrCreateCity(cityName: string): Promise<number> {
  const slug = generateSlug(cityName);
  const existingCity = await prisma.city.findFirst({
    where: {
      OR: [{ name: cityName }, { slug }],
    },
  });

  if (existingCity) {
    return existingCity.id;
  }

  const regionSlug = regionSlugForCityName(cityName) ?? 'vinnicka-oblast';
  const region = await prisma.region.findUnique({
    where: { slug: regionSlug },
  });
  if (!region) {
    throw new Error(`Region not found for slug: ${regionSlug}`);
  }

  const newCity = await prisma.city.create({
    data: {
      name: cityName,
      slug,
      regionId: region.id,
    },
  });

  return newCity.id;
}

const productsData = [
  {
    name: 'ПРОКАТ ШТУРМОВОЇ ГВИНТІВКИ, КЛАС 1',
    price: 300,
    description: 'Гвинтівки ТМ "SPECNA ARMS"',
    image: '/uploads/shturmova-gvintivka-specna-arms.png',
    inStock: true,
    isActive: true,
  },
  {
    name: 'ПРОКАТ ШТУРМОВОЇ ГВИНТІВКИ, КЛАС 2',
    price: 200,
    description: 'Гвинтівки інших брендів',
    image: '/uploads/shturmova-gvintivka-klass-2.png',
    inStock: true,
    isActive: true,
  },
  {
    name: 'ПРОКАТ ДОДАТКОВОГО СПОРЯДЖЕННЯ',
    price: 300,
    description: 'Одяг, окуляри, маска, навушники',
    image: '/uploads/dodatkove.png',
    inStock: true,
    isActive: true,
  },
  {
    name: 'ПРОКАТ КОМПЛЕКТ',
    price: 500,
    description: 'Гвинтівка 1 класу та додаткове спорядження',
    image: '/uploads/shturmova-gvintivka-specna-arms.png',
    inStock: true,
    isActive: true,
  },
  {
    name: 'ПРОКАТ ШТУРМОВОЇ ГВИНТІВКИ, КЛАС 1',
    price: 300,
    description: 'Гвинтівки ТМ "SPECNA ARMS"',
    image: '/uploads/shturmova-gvintivka-specna-arms.png',
    inStock: true,
    isActive: true,
  },
  {
    name: 'ПРОКАТ ШТУРМОВОЇ ГВИНТІВКИ, КЛАС 2',
    price: 200,
    description: 'Гвинтівки інших брендів',
    image: '/uploads/shturmova-gvintivka-klass-2.png',
    inStock: true,
    isActive: true,
  },
  {
    name: 'ПРОКАТ ДОДАТКОВОГО СПОРЯДЖЕННЯ',
    price: 300,
    description: 'Одяг, окуляри, маска, навушники',
    image: '/uploads/dodatkove.png',
    inStock: true,
    isActive: true,
  },
  {
    name: 'ПРОКАТ КОМПЛЕКТ',
    price: 500,
    description: 'Гвинтівка 1 класу та додаткове спорядження',
    image: '/uploads/shturmova-gvintivka-specna-arms.png',
    inStock: true,
    isActive: true,
  },
  {
    name: 'ПРОКАТ ШТУРМОВОЇ ГВИНТІВКИ, КЛАС 1',
    price: 300,
    description: 'Гвинтівки ТМ "SPECNA ARMS"',
    image: '/uploads/shturmova-gvintivka-specna-arms.png',
    inStock: true,
    isActive: true,
  },
  {
    name: 'ПРОКАТ ШТУРМОВОЇ ГВИНТІВКИ, КЛАС 2',
    price: 200,
    description: 'Гвинтівки інших брендів',
    image: '/uploads/shturmova-gvintivka-klass-2.png',
    inStock: true,
    isActive: true,
  },
  {
    name: 'ПРОКАТ ДОДАТКОВОГО СПОРЯДЖЕННЯ',
    price: 300,
    description: 'Одяг, окуляри, маска, навушники',
    image: '/uploads/dodatkove.png',
    inStock: true,
    isActive: true,
  },
  {
    name: 'ПРОКАТ КОМПЛЕКТ',
    price: 500,
    description: 'Гвинтівка 1 класу та додаткове спорядження',
    image: '/uploads/shturmova-gvintivka-specna-arms.png',
    inStock: true,
    isActive: true,
  },
  {
    name: 'ПРОКАТ ШТУРМОВОЇ ГВИНТІВКИ, КЛАС 1',
    price: 300,
    description: 'Гвинтівки ТМ "SPECNA ARMS"',
    image: '/uploads/shturmova-gvintivka-specna-arms.png',
    inStock: true,
    isActive: true,
  },
  {
    name: 'ПРОКАТ ШТУРМОВОЇ ГВИНТІВКИ, КЛАС 2',
    price: 200,
    description: 'Гвинтівки інших брендів',
    image: '/uploads/shturmova-gvintivka-klass-2.png',
    inStock: true,
    isActive: true,
  },
  {
    name: 'ПРОКАТ ДОДАТКОВОГО СПОРЯДЖЕННЯ',
    price: 300,
    description: 'Одяг, окуляри, маска, навушники',
    image: '/uploads/dodatkove.png',
    inStock: true,
    isActive: true,
  },
  {
    name: 'ПРОКАТ КОМПЛЕКТ',
    price: 500,
    description: 'Гвинтівка 1 класу та додаткове спорядження',
    image: '/uploads/shturmova-gvintivka-specna-arms.png',
    inStock: true,
    isActive: true,
  },
];

async function seedProducts() {
  try {
    await prisma.orderProduct.deleteMany({});
    await prisma.product.deleteMany({});

    const lvivCityId = await getOrCreateCity('Львів');
    const ifCityId = await getOrCreateCity('Івано-Франківськ');

    const cities = [lvivCityId, ifCityId, null];
    const slugCounts = new Map<string, number>();

    const products = productsData.map((product, index) => ({
      ...product,
      cityId: cities[index % cities.length],
      slug: (() => {
        const baseSlug = generateSlug(product.name);
        const nextCount = (slugCounts.get(baseSlug) ?? 0) + 1;
        slugCounts.set(baseSlug, nextCount);

        return nextCount === 1 ? baseSlug : `${baseSlug}-${nextCount}`;
      })(),
    }));

    await prisma.product.createMany({
      data: products,
    });

    console.log(`Created ${products.length} products successfully`);
  } catch (error) {
    console.error('Error while seeding products:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    await pool.end().catch(() => undefined);
  }
}

void seedProducts();
