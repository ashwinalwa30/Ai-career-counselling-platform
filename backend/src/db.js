import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

import { PrismaClient } from '@prisma/client';

// Prefer Neon pooled connection for IPv4 routing and cold-start resilience
const rawUrl = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL;
let dbUrl = rawUrl;
if (dbUrl && !dbUrl.includes('connect_timeout=')) {
  const separator = dbUrl.includes('?') ? '&' : '?';
  dbUrl = `${dbUrl}${separator}connect_timeout=30`;
}

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasources: dbUrl ? { db: { url: dbUrl } } : undefined,
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
