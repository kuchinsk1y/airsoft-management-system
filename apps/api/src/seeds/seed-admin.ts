import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaClient } from '../generated/prisma-client';
import { DATABASE_URL } from '../utils/config';

const pool = new Pool({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function ensureAdminAcl(userId: number) {
  await prisma.acl.createMany({
    data: [
      {
        userId,
        permission: 'write',
        resource: 'system',
        applicationId: null,
      },
    ],
    skipDuplicates: true,
  });
}

async function main() {
  const isProd = process.env.NODE_ENV === 'production';
  const email = process.env.ADMIN_EMAIL || (isProd ? '' : 'admin@example.com');
  const password = process.env.ADMIN_PASSWORD || (isProd ? '' : 'Passw0rd!');
  const nickName = process.env.ADMIN_NICKNAME || 'admin';

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD env vars are required');
  }

  const [existingByEmail, existingByNickName] = await Promise.all([
    prisma.user.findUnique({ where: { email } }),
    prisma.user.findUnique({ where: { nickName } }),
  ]);

  if (existingByEmail) {
    await ensureAdminAcl(existingByEmail.id);
    console.log(`Admin user already exists: ${email}`);
    return;
  }

  if (existingByNickName && existingByNickName.email !== email) {
    console.warn(
      `Skip admin seed: nickname "${nickName}" is already used by ${existingByNickName.email}. Set ADMIN_NICKNAME to a unique value.`,
    );
    return;
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      fullName: 'Admin User',
      nickName,
      phoneNumber: null,
      password: hashed,
      dateOfBirth: new Date('2004-08-03'),
      country: 'UA',
      region: 'Kyiv',
      city: 'Kyiv',
      isVerified: true,
    },
  });

  await ensureAdminAcl(user.id);

  console.log(`Admin user created: ${email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end().catch(() => undefined);
  });
