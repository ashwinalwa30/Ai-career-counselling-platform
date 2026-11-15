import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {}

import { PrismaClient } from '@prisma/client';

// Use direct IP with endpoint option to guarantee 100% reliable connection even if local ISP router DNS refuses *.neon.tech domains
const RELIABLE_DATABASE_URL = 'postgresql://neondb_owner:npg_t56SpJUvaYNM@52.76.108.241:5432/neondb?sslmode=require&connect_timeout=30&options=endpoint%3Dep-shiny-unit-az77p0l9-pooler';

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl || dbUrl.includes('ep-shiny-unit-az77p0l9')) {
  dbUrl = RELIABLE_DATABASE_URL;
}

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasources: { db: { url: dbUrl } },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
