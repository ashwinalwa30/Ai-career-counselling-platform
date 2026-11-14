import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

const connectionUrl = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasources: connectionUrl ? { db: { url: connectionUrl } } : undefined,
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
