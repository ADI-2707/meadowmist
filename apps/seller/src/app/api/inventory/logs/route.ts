import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSessionUser } from '@/lib/session';
import { parsePaginationParams } from '@meadowmist/shared';

export async function GET(request?: Request) {
  try {
    const admin = await getAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = request ? new URL(request.url) : new URL('http://localhost/api/inventory/logs');
    const { page, limit, skip } = parsePaginationParams(url, 20, 100);

    const [total, logs] = await Promise.all([
      prisma.inventoryLog.count(),
      prisma.inventoryLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              category: true,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Inventory logs GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory logs' }, { status: 500 });
  }
}
