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
    const filter = url.searchParams.get('filter');
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');
    const isPaginated = pageParam !== null || limitParam !== null;
    const { page, limit, skip } = parsePaginationParams(url, 20, 100);

    const allMetrics = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        price: true,
        salePrice: true,
        stockQuantity: true,
        category: true,
        lowStockThreshold: true,
      },
    });

    const totalCandles = allMetrics
      .filter((p) => p.category === 'candle')
      .reduce((sum, p) => sum + p.stockQuantity, 0);

    const totalCeramics = allMetrics
      .filter((p) => p.category === 'ceramic')
      .reduce((sum, p) => sum + p.stockQuantity, 0);

    const totalInventoryValue = allMetrics.reduce(
      (sum, p) => sum + (p.salePrice ?? p.price) * p.stockQuantity,
      0
    );

    const lowStockIds = allMetrics
      .filter((p) => p.stockQuantity > 0 && p.stockQuantity <= p.lowStockThreshold)
      .map((p) => p.id);

    const outOfStockCount = allMetrics.filter((p) => p.stockQuantity === 0).length;

    let total = 0;
    let products: unknown[] = [];

    if (filter === 'LOW_STOCK') {
      total = lowStockIds.length;
      const targetIds = isPaginated ? lowStockIds.slice(skip, skip + limit) : lowStockIds;
      products = targetIds.length > 0
        ? await prisma.product.findMany({
            where: { id: { in: targetIds } },
            include: {
              variants: true,
              _count: {
                select: {
                  restockAlerts: {
                    where: { notified: false },
                  },
                },
              },
            },
            orderBy: [{ stockQuantity: 'asc' }, { name: 'asc' }],
          })
        : [];
    } else {
      const whereClause: {
        isActive: boolean;
        category?: string;
        stockQuantity?: number;
      } = { isActive: true };

      if (filter === 'OUT_OF_STOCK') {
        whereClause.stockQuantity = 0;
      } else if (filter === 'CANDLES') {
        whereClause.category = 'candle';
      } else if (filter === 'CERAMICS') {
        whereClause.category = 'ceramic';
      }

      const [count, list] = await Promise.all([
        prisma.product.count({ where: whereClause }),
        prisma.product.findMany({
          where: whereClause,
          include: {
            variants: true,
            _count: {
              select: {
                restockAlerts: {
                  where: { notified: false },
                },
              },
            },
          },
          orderBy: [{ stockQuantity: 'asc' }, { name: 'asc' }],
          ...(isPaginated ? { skip, take: limit } : {}),
        }),
      ]);
      total = count;
      products = list;
    }

    return NextResponse.json({
      products,
      summary: {
        totalCandles,
        totalCeramics,
        totalInventoryValue,
        lowStockCount: lowStockIds.length,
        outOfStockCount,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error('Inventory GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, variantId, changeQuantity, newQuantity, reason = 'MANUAL_ADJUSTMENT', note } = body;

    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
      });

      if (!variant) {
        return NextResponse.json({ error: 'Variant not found' }, { status: 404 });
      }

      let targetStock = variant.stockQuantity;
      let delta = 0;

      if (newQuantity !== undefined) {
        targetStock = Math.max(0, Number(newQuantity));
        delta = targetStock - variant.stockQuantity;
      } else if (changeQuantity !== undefined) {
        delta = Number(changeQuantity);
        targetStock = Math.max(0, variant.stockQuantity + delta);
      }

      const updatedVariant = await prisma.$transaction(async (tx) => {
        const v = await tx.productVariant.update({
          where: { id: variantId },
          data: {
            stockQuantity: targetStock,
            inStock: targetStock > 0,
          },
        });

        await tx.inventoryLog.create({
          data: {
            productId: variant.productId,
            changeQuantity: delta,
            newQuantity: targetStock,
            reason: String(reason),
            note: note ? String(note).trim() : `Variant stock update: ${variant.sku}`,
          },
        });

        return v;
      });

      return NextResponse.json({ variant: updatedVariant });
    }

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    let targetStock = product.stockQuantity;
    let delta = 0;

    if (newQuantity !== undefined) {
      targetStock = Math.max(0, Number(newQuantity));
      delta = targetStock - product.stockQuantity;
    } else if (changeQuantity !== undefined) {
      delta = Number(changeQuantity);
      targetStock = Math.max(0, product.stockQuantity + delta);
    }

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          stockQuantity: targetStock,
          inStock: targetStock > 0,
        },
      });

      await tx.inventoryLog.create({
        data: {
          productId,
          changeQuantity: delta,
          newQuantity: targetStock,
          reason: String(reason),
          note: note ? String(note).trim() : null,
        },
      });

      return updated;
    });

    return NextResponse.json({ product: result });
  } catch (error) {
    console.error('Inventory PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update stock' }, { status: 500 });
  }
}
