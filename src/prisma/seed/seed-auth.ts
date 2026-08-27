import 'dotenv/config';
import { PrismaClient, EntityStatus } from '@generated/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Starting Auth Seeding...');

  // 1. Departments
  const itDept = await prisma.department.upsert({
    where: { name: 'IT' },
    update: {},
    create: { name: 'IT', description: 'Information Technology' }
  });
  const salesDept = await prisma.department.upsert({
    where: { name: 'Sales' },
    update: {},
    create: { name: 'Sales', description: 'Sales and CRM' }
  });

  // 2. Roles
  const superadminRole = await prisma.role.upsert({
    where: { name: 'SUPERADMIN' },
    update: {},
    create: { name: 'SUPERADMIN', description: 'Global Administrator', isSystem: true }
  });
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'Administrator', isSystem: true }
  });
  const userRole = await prisma.role.upsert({
    where: { name: 'USER' },
    update: {},
    create: { name: 'USER', description: 'Standard User', isSystem: true }
  });

  // 3. Permissions
  const pManageUsers = await prisma.permission.upsert({
    where: { action: 'MANAGE_USERS' },
    update: {},
    create: { action: 'MANAGE_USERS', description: 'Can create and manage users' }
  });
  const pManageSales = await prisma.permission.upsert({
    where: { action: 'MANAGE_SALES' },
    update: {},
    create: { action: 'MANAGE_SALES', description: 'Can manage sales data' }
  });

  // Assign permissions to roles
  await prisma.role.update({
    where: { id: superadminRole.id },
    data: { permissions: { connect: [{ id: pManageUsers.id }, { id: pManageSales.id }] } }
  });
  await prisma.role.update({
    where: { id: adminRole.id },
    data: { permissions: { connect: [{ id: pManageSales.id }] } }
  });

  // 4. Users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Global Admin
  await prisma.user.upsert({
    where: { email: 'admin@exlogis.com' },
    update: {
      roles: { connect: [{ id: superadminRole.id }] },
      departmentId: itDept.id
    },
    create: {
      email: 'admin@exlogis.com',
      name: 'Admin User',
      password: hashedPassword,
      status: EntityStatus.ACTIVE,
      departmentId: itDept.id,
      roles: { connect: [{ id: superadminRole.id }] }
    }
  });

  // Dummy Sales User
  await prisma.user.upsert({
    where: { email: 'sales@exlogis.com' },
    update: {
      roles: { connect: [{ id: userRole.id }] },
      departmentId: salesDept.id
    },
    create: {
      email: 'sales@exlogis.com',
      name: 'Sales Rep',
      password: hashedPassword,
      status: EntityStatus.ACTIVE,
      departmentId: salesDept.id,
      roles: { connect: [{ id: userRole.id }] }
    }
  });

  console.log('Auth Seeding completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
