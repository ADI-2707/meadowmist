import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser, getAdminSessionUser } from '@/lib/session';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { reason = 'Customer requested cancellation' } = body;

    const session = await getSessionUser();
    const admin = await getAdminSessionUser();

    if (!session && !admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!admin && order.userId !== session?.userId) {
      return NextResponse.json({ error: 'Unauthorized to cancel this order' }, { status: 403 });
    }

    if (order.status !== 'PENDING' && order.status !== 'PROCESSING') {
      return NextResponse.json(
        { error: `Cannot cancel an order that is already ${order.status.toLowerCase()}` },
        { status: 400 }
      );
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (product) {
          const restoredStock = product.stockQuantity + item.quantity;
          await tx.product.update({
            where: { id: product.id },
            data: {
              stockQuantity: restoredStock,
              inStock: true,
            },
          });

          await tx.inventoryLog.create({
            data: {
              productId: product.id,
              changeQuantity: item.quantity,
              newQuantity: restoredStock,
              reason: 'ORDER_CANCELLED',
              note: `Order ${order.orderNumber} cancelled: ${reason}`,
            },
          });
        }

        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });

          if (variant) {
            const restoredVariantStock = variant.stockQuantity + item.quantity;
            await tx.productVariant.update({
              where: { id: variant.id },
              data: {
                stockQuantity: restoredVariantStock,
                inStock: true,
              },
            });

            await tx.inventoryLog.create({
              data: {
                productId: variant.productId,
                changeQuantity: item.quantity,
                newQuantity: restoredVariantStock,
                reason: 'ORDER_CANCELLED',
                note: `Order ${order.orderNumber} cancelled: ${reason} (Variant: ${variant.sku})`,
              },
            });
          }
        }
      }

      return tx.order.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancellationReason: String(reason).trim(),
          cancelledAt: new Date(),
        },
      });
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error('Order cancellation error:', error);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
  }
}
