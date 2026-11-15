import dns from 'dns';
try {
  dns.setDefaultResultOrder('ipv4first');
} catch {}

import { PrismaClient } from '@prisma/client';

// Default Neon pooler connection URL with dual-stack IPv4/IPv6 support and 30s connection timeout
const DEFAULT_DATABASE_URL = 'postgresql://neondb_owner:npg_t56SpJUvaYNM@ep-shiny-unit-az77p0l9-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&connect_timeout=30';

const rawUrl = process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
let dbUrl = rawUrl;
if (dbUrl && !dbUrl.includes('connect_timeout=')) {
  const separator = dbUrl.includes('?') ? '&' : '?';
  dbUrl = `${dbUrl}${separator}connect_timeout=30`;
}

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  datasources: { db: { url: dbUrl } },
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
