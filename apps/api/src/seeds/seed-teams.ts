import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import {
  AclPermission,
  PrismaClient,
  TeamMemberStatus,
} from '../generated/prisma-client';
import { DATABASE_URL } from '../utils/config';

const pool = new Pool({ connectionString: DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

type DemoUser = {
  email: string;
  nickName: string;
  fullName: string;
};

const TARGET_TEAMS = 33;

async function upsertUser(user: DemoUser) {
  const existingByEmail = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true },
  });

  if (existingByEmail) {
    return prisma.user.update({
      where: { email: user.email },
      data: {
        nickName: user.nickName,
        fullName: user.fullName,
        isVerified: true,
      },
      select: { id: true },
    });
  }

  const password = await bcrypt.hash('Passw0rd!', 10);
  return prisma.user.create({
    data: {
      email: user.email,
      nickName: user.nickName,
      fullName: user.fullName,
      password,
      country: 'UA',
      city: 'Kyiv',
      isVerified: true,
    },
    select: { id: true },
  });
}

function ratingFrom(name: string, membersCount: number) {
  const base = membersCount * 10 + name.length * 3;
  return Math.max(1, Math.min(999, base));
}

async function seedTeams() {
  const baseUsers: DemoUser[] = [
    {
      email: 'team.owner1@example.com',
      nickName: 'OwnerOne',
      fullName: 'Owner One',
    },
    {
      email: 'team.owner2@example.com',
      nickName: 'OwnerTwo',
      fullName: 'Owner Two',
    },
    {
      email: 'team.member1@example.com',
      nickName: 'MemberOne',
      fullName: 'Member One',
    },
    {
      email: 'team.member2@example.com',
      nickName: 'MemberTwo',
      fullName: 'Member Two',
    },
    {
      email: 'team.member3@example.com',
      nickName: 'MemberThree',
      fullName: 'Member Three',
    },
  ];

  const generatedUsers: DemoUser[] = Array.from(
    { length: TARGET_TEAMS },
    (_, i) => {
      const idx = i + 1;
      return [
        {
          email: `team.auto.owner${idx}@example.com`,
          nickName: `AutoOwner${idx}`,
          fullName: `Auto Owner ${idx}`,
        },
        {
          email: `team.auto.member${idx}@example.com`,
          nickName: `AutoMember${idx}`,
          fullName: `Auto Member ${idx}`,
        },
      ];
    },
  ).flat();

  const demoUsers: DemoUser[] = [...baseUsers, ...generatedUsers];

  const createdUsers = await Promise.all(demoUsers.map(upsertUser));
  const ids = Object.fromEntries(
    demoUsers.map((u, i) => [u.nickName, createdUsers[i].id] as const),
  );

  const teams = [
    {
      name: 'NIGHT STALKERS',
      description: 'Demo team with 2 members (owner + member).',
      logoUrl: '/TopLogo.svg',
      ownerId: ids.OwnerOne,
      assistants: [] as number[],
      members: [ids.MemberOne],
      staff: [] as Array<{ userId: number; role: string }>,
    },
    {
      name: 'GHOST HAWKS',
      description: 'Demo team with assistant and staff.',
      logoUrl: '/TopLogo.svg',
      ownerId: ids.OwnerTwo,
      assistants: [ids.MemberTwo],
      members: [ids.MemberThree],
      staff: [{ userId: ids.MemberOne, role: 'medic' }],
    },
    {
      name: 'IRON LEGION',
      description: 'Demo team with 4 active members.',
      logoUrl: '/TopLogo.svg',
      ownerId: ids.OwnerOne,
      assistants: [] as number[],
      members: [ids.MemberTwo, ids.MemberThree, ids.MemberOne],
      staff: [] as Array<{ userId: number; role: string }>,
    },
  ];

  const generatedTeamsCount = Math.max(0, TARGET_TEAMS - teams.length);
  const generatedTeams = Array.from({ length: generatedTeamsCount }, (_, i) => {
    const idx = i + 1;
    return {
      name: `AUTO TEAM ${idx}`,
      description: `Auto-generated team ${idx} for rating pagination tests.`,
      logoUrl: '/TopLogo.svg',
      ownerId: ids[`AutoOwner${idx}` as keyof typeof ids],
      assistants: [] as number[],
      members: [ids[`AutoMember${idx}` as keyof typeof ids]],
      staff: [] as Array<{ userId: number; role: string }>,
    };
  });

  const allTeamsToSeed = [...teams, ...generatedTeams];

  for (const t of allTeamsToSeed) {
    const team = await prisma.team.upsert({
      where: { name: t.name },
      create: {
        name: t.name,
        description: t.description,
        logoUrl: t.logoUrl,
      },
      update: {
        description: t.description,
        logoUrl: t.logoUrl,
      },
      select: { id: true, name: true },
    });

    const now = new Date();

    const memberUserIds = [
      t.ownerId,
      ...t.assistants,
      ...t.members,
      ...t.staff.map((s) => s.userId),
    ];
    await prisma.teamMember.createMany({
      data: memberUserIds.map((userId) => ({
        teamId: team.id,
        userId,
        memberStatus: TeamMemberStatus.ACTIVE,
        joinedAt: now,
      })),
      skipDuplicates: true,
    });

    await prisma.acl.deleteMany({
      where: {
        resource: { startsWith: `team/${team.id}/` },
      },
    });

    const aclGrants = [
      {
        userId: t.ownerId,
        permission: AclPermission.write,
        resource: `team/${team.id}/owner`,
        applicationId: null,
      },
      ...t.assistants.map((userId) => ({
        userId,
        permission: AclPermission.write,
        resource: `team/${team.id}/assistant`,
        applicationId: null,
      })),
      ...t.members.map((userId) => ({
        userId,
        permission: AclPermission.read,
        resource: `team/${team.id}/member`,
        applicationId: null,
      })),
      ...t.staff.map(({ userId, role }) => ({
        userId,
        permission: AclPermission.read,
        resource: `team/${team.id}/staff/${role}`,
        applicationId: null,
      })),
    ];

    aclGrants.push({
      userId: t.ownerId,
      permission: AclPermission.read,
      resource: `team/${team.id}/member`,
      applicationId: null,
    });

    await prisma.acl.createMany({ data: aclGrants });

    const membersCount = memberUserIds.length;
    console.log(
      `✅ Team seeded: ${team.name} (id=${team.id}, members=${membersCount}, rating≈${ratingFrom(t.name, membersCount)})`,
    );
  }
}

seedTeams()
  .catch((err) => {
    console.error('❌ Error while seeding teams:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end().catch(() => undefined);
  });
