import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@example.com' },
    update: {},
    create: {
      email: 'analyst@example.com',
      password: hashedPassword,
      name: 'Analyst User',
      role: 'ANALYST',
      status: 'ACTIVE',
    },
  });

  const viewer = await prisma.user.upsert({
    where: { email: 'viewer@example.com' },
    update: {},
    create: {
      email: 'viewer@example.com',
      password: hashedPassword,
      name: 'Viewer User',
      role: 'VIEWER',
      status: 'ACTIVE',
    },
  });

  console.log('✅ Users created');

  // Create sample transactions for admin
  const transactions = [
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
      description: 'Monthly rent payment',
      userId: admin.id,
    },
    {
      amount: 300,
      type: 'EXPENSE',
      category: 'Groceries',
      date: new Date('2024-01-10'),
      description: 'Weekly groceries',
      userId: admin.id,
    },
    {
      amount: 150,
      type: 'EXPENSE',
      category: 'Utilities',
      date: new Date('2024-01-08'),
      description: 'Electricity and water',
      userId: admin.id,
    },
    {
      amount: 500,
      type: 'INCOME',
      category: 'Freelance',
      date: new Date('2024-01-20'),
      description: 'Freelance project payment',
      userId: admin.id,
    },
  ];

  for (const transaction of transactions) {
    await prisma.transaction.create({ data: transaction });
  }

  // Create transactions for analyst
  await prisma.transaction.createMany({
    data: [
      {
        amount: 4500,
        type: 'INCOME',
        category: 'Salary',
        date: new Date('2024-01-15'),
        description: 'Monthly salary',
        userId: analyst.id,
      },
      {
        amount: 1000,
        type: 'EXPENSE',
        category: 'Rent',
        date: new Date('2024-01-05'),
        userId: analyst.id,
      },
    ],
  });

  // Create transactions for viewer
  await prisma.transaction.createMany({
    data: [
      {
        amount: 3500,
        type: 'INCOME',
        category: 'Salary',
        date: new Date('2024-01-15'),
        userId: viewer.id,
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

  console.log('✅ Transactions created');
  console.log('\n📝 Sample credentials:');
  console.log('Admin: admin@example.com / password123');
  console.log('Analyst: analyst@example.com / password123');
  console.log('Viewer: viewer@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
