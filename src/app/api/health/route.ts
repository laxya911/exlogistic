import { NextResponse } from 'next/server';
import { prisma } from '@/repositories/prisma.client';
import { logger } from '@/lib/logger';

export async function GET() {
  const start = Date.now();
  let dbStatus = 'disconnected';

  try {
    // Ping DB
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (e) {
    logger.error('Health Check: DB Connection Failed', e);
  }

  const duration = Date.now() - start;

  const healthData = {
    status: dbStatus === 'connected' ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: dbStatus,
    latencyMs: duration
  };

  return NextResponse.json(healthData, { 
    status: dbStatus === 'connected' ? 200 : 503 
  });
}
