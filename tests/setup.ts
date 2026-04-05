import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function cleanDatabase() {
  await prisma.transaction.deleteMany();
  await prisma.user.deleteMany();
}

export async function seedTestData() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: hashedPassword,
      name: 'Test Admin',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const analyst = await prisma.user.create({
    data: {
      email: 'analyst@test.com',
      password: hashedPassword,
      name: 'Test Analyst',
      role: 'ANALYST',
      status: 'ACTIVE',
    },
  });

  const viewer = await prisma.user.create({
    data: {
      email: 'viewer@test.com',
      password: hashedPassword,
      name: 'Test Viewer',
      role: 'VIEWER',
      status: 'ACTIVE',
    },
  });

  const inactive = await prisma.user.create({
    data: {
      email: 'inactive@test.com',
      password: hashedPassword,
      name: 'Inactive User',
      role: 'VIEWER',
      status: 'INACTIVE',
    },
  });

  // Create sample transactions
  await prisma.transaction.createMany({
    data: [
      {
        amount: 5000,
        type: 'INCOME',
        category: 'Salary',
        date: new Date('2024-01-15'),
        description: 'Monthly salary',
        userId: admin.id,
      },
      {
        amount: 1200,
        type: 'EXPENSE',
        category: 'Rent',
        date: new Date('2024-01-05'),
        description: 'Monthly rent',
        userId: admin.id,
      },
      {
        amount: 300,
        type: 'EXPENSE',
        category: 'Groceries',
        date: new Date('2024-02-10'),
        description: 'Weekly groceries',
        userId: admin.id,
      },
      {
        amount: 4500,
        type: 'INCOME',
        category: 'Salary',
        date: new Date('2024-01-15'),
        description: 'Monthly salary',
        userId: analyst.id,
      },
      {
        amount: 800,
        type: 'EXPENSE',
        category: 'Rent',
        date: new Date('2024-01-05'),
        userId: viewer.id,
      },
    ],
  });

  return { admin, analyst, viewer, inactive };
}

export { prisma };
