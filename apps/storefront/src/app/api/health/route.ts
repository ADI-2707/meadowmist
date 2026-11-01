import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const start = Date.now();
  try {
    // Ultra-lightweight raw SQL ping (1-2ms, 0 table locks, releases PgBouncer socket immediately)
    await prisma.$queryRaw`SELECT 1 as ping;`;
    const latencyMs = Date.now() - start;

    return NextResponse.json(
      {
        status: 'ok',
        service: 'storefront',
        database: 'connected',
        latencyMs,
        timestamp: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    const latencyMs = Date.now() - start;
    console.error('[HealthCheck] Database connection error:', error);
    return NextResponse.json(
      {
        status: 'degraded',
        service: 'storefront',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown database error',
        latencyMs,
        timestamp: new Date().toISOString(),
      },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        },
      }
    );
  }
}

export async function HEAD() {
  return GET();
}
