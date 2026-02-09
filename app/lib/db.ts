import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// 1. Create a database connection pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Initialize the Prisma Driver Adapter
const adapter = new PrismaPg(pool);

export const prisma =
  global.prisma ??
  // 3. Pass the adapter to the PrismaClient constructor
  new PrismaClient({
    adapter,
    log: ['query'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}



// // lib/db.ts
// import { PrismaClient } from '@prisma/client';


// declare global {
//   // eslint-disable-next-line no-var
//   var prisma: PrismaClient | undefined;
// }

// export const prisma =
//   global.prisma ??
//   new PrismaClient({
//     log: ['query'], // optional; remove if noisy
//   });

// if (process.env.NODE_ENV !== 'production') {
//   global.prisma = prisma;
// }
