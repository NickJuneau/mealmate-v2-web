import { PrismaClient, type Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global {
  var prisma: PrismaClient | undefined;
}

// 1. Create a database connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Initialize the Prisma Driver Adapter
const adapter = new PrismaPg(pool);
const prismaLog: Prisma.LogLevel[] =
  process.env.NODE_ENV === 'production'
    ? ['warn', 'error']
    : ['query', 'warn', 'error'];

export const prisma =
  global.prisma ??
  // 3. Pass the adapter to the PrismaClient constructor
  new PrismaClient({
    adapter,
    log: prismaLog
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
