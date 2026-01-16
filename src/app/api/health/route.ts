import { NextResponse } from 'next/server';
import { prisma } from '@/shared/lib/db';
import { pingRedis } from '@/infrastructure/rate-limit/redis-client';
import { verifyEmailTransport } from '@/infrastructure/email/email-client';

export const runtime = 'nodejs';

export async function GET() {
  const startTime = Date.now();

  const checks = await Promise.allSettled([
    prisma.$queryRaw`SELECT 1`,
    pingRedis(),
    verifyEmailTransport(),
  ]);

  const responseTime = Date.now() - startTime;

  const [dbCheck, redisCheck, smtpCheck] = checks;

  const services = {
    database: dbCheck.status === 'fulfilled' ? 'ok' : 'error',
    redis:
      redisCheck.status === 'fulfilled' && redisCheck.value ? 'ok' : 'error',
    smtp: smtpCheck.status === 'fulfilled' && smtpCheck.value ? 'ok' : 'error',
  };

  const allHealthy = Object.values(services).every((s) => s === 'ok');

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      responseTime,
      services,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
