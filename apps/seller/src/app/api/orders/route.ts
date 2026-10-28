import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSessionUser } from '@/lib/session';
import { parsePaginationParams } from '@meadowmist/shared';

export async function GET(request: Request) {
  try {
    const admin = await getAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');
    const returnStatus = url.searchParams.get('returnStatus');

    const whereClause: {
      status?: string;
      returnStatus?: string | { not: string };
      OR?: { [key: string]: unknown }[];
    } = {};

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (returnStatus) {
      if (returnStatus === 'ANY') {
        whereClause.returnStatus = { not: 'NONE' };
      } else {
        whereClause.returnStatus = returnStatus;
      }
    }

    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { orderNumber: { contains: q } },
        { user: { name: { contains: q } } },
        { user: { email: { contains: q } } },
      ];
    }

    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');
    const isPaginated = pageParam !== null || limitParam !== null;
    const { page, limit, skip } = parsePaginationParams(url, 20, 100);

    const [total, orders] = await Promise.all([
      prisma.order.count({ where: whereClause }),
      prisma.order.findMany({
        where: whereClause,
        include: {
          items: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        ...(isPaginated ? { skip, take: limit } : {}),
      }),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      orders,
      pagination: isPaginated
        ? {
            page,
            limit,
            total,
            totalPages,
          }
        : null,
    });
  } catch (error) {
    console.error('Admin orders GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
