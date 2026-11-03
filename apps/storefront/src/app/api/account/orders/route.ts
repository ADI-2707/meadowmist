import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { parsePaginationParams } from '@meadowmist/shared';

export async function GET(request?: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = request ? new URL(request.url) : new URL('http://localhost/api/account/orders');
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');
    const isPaginated = pageParam !== null || limitParam !== null;
    const { page, limit, skip } = parsePaginationParams(url, 10, 50);

    const whereClause = { userId: session.userId };

    const [total, orders] = await Promise.all([
      prisma.order.count({ where: whereClause }),
      prisma.order.findMany({
        where: whereClause,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  slug: true,
                  category: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        ...(isPaginated ? { skip, take: limit } : {}),
      }),
    ]);

    const totalPages = isPaginated ? Math.ceil(total / limit) : 1;

    return NextResponse.json({
      orders,
      pagination: {
        page: isPaginated ? page : 1,
        limit: isPaginated ? limit : total,
        total,
        totalPages,
        hasNext: isPaginated ? page < totalPages : false,
        hasPrev: isPaginated ? page > 1 : false,
      },
    });
  } catch (error) {
    console.error('Orders fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
