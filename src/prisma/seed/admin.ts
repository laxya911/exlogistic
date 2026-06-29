import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding initial Admin user...');

  const email = 'admin@exlogis.com';
  const password = 'password123';
  const hashedPassword = await bcrypt.hash(password, 10);

  // Seed Company
  await prisma.company.upsert({
    where: { id: 'default-company' },
    update: {},
    create: {
      id: 'default-company',
      name: 'ExLogis Global ERP',
      taxId: 'TAX-8899-002',
      timezone: 'Asia/Singapore',
      currency: 'USD',
      emails: ['contact@exlogis.com', 'support@exlogis.com'],
      websites: ['https://exlogis.com'],
      branches: [
        { name: 'HQ', address: '100 Matrix Tower, Global Hub, Singapore' },
        { name: 'EU Office', address: 'Rotterdam Port, Netherlands' }
      ]
    },
  });

  // Seed System Preferences
  await prisma.systemPreference.upsert({
    where: { id: 'default-prefs' },
    update: {},
    create: {
      id: 'default-prefs',
    },
  });

  const adminDept = await prisma.department.upsert({
    where: { name: 'Operations' },
    update: {},
    create: { name: 'Operations', description: 'Core ERP Operations' },
  });

  const adminTeam = await prisma.team.upsert({
    where: { name_departmentId: { name: 'Management', departmentId: adminDept.id } },
    update: {},
    create: { name: 'Management', departmentId: adminDept.id, description: 'Executive Management Team' },
  });

  const adminPos = await prisma.position.upsert({
    where: { title: 'System Administrator' },
    update: {},
    create: { title: 'System Administrator', description: 'Platform Root Admin' },
  });

  // Seed Permissions
  const permissions = [
    { action: 'users:read', description: 'View users' },
    { action: 'users:manage', description: 'Manage users' },
    { action: 'roles:manage', description: 'Manage roles and permissions' },
    { action: 'settings:manage', description: 'Manage system settings' },
  ];

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { action: p.action },
      update: {},
      create: p,
    });
  }

  const allPerms = await prisma.permission.findMany();

  // Seed Roles
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'Super Admin' },
    update: {
      permissions: {
        connect: allPerms.map(p => ({ id: p.id })),
      },
    },
    create: {
      name: 'Super Admin',
      description: 'Unrestricted access to all modules',
      isSystem: true,
      permissions: {
        connect: allPerms.map(p => ({ id: p.id })),
      },
    },
  });

  await prisma.role.upsert({
    where: { name: 'Manager' },
    update: {},
    create: { name: 'Manager', description: 'Department-level manager' },
  });

  await prisma.role.upsert({
    where: { name: 'Staff' },
    update: {},
    create: { name: 'Staff', description: 'General operational staff' },
  });

  await prisma.role.upsert({
    where: { name: 'Read-Only' },
    update: {},
    create: { name: 'Read-Only', description: 'Can view records but cannot modify' },
  });

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      departmentId: adminDept.id,
      teamId: adminTeam.id,
      positionId: adminPos.id,
      roles: {
        connect: [{ id: superAdminRole.id }],
      },
    },
    create: {
      email,
      name: 'System Admin',
      password: hashedPassword,
      departmentId: adminDept.id,
      teamId: adminTeam.id,
      positionId: adminPos.id,
      roles: {
        connect: [{ id: superAdminRole.id }],
      },
    },
  });

  console.log(`Admin user created: ${admin.email}`);
  console.log('Password is: password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
