import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSessionUser } from '@/lib/session';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const admin = await getAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
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
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Order detail GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch order detail' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const admin = await getAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const {
      status,
      paymentStatus,
      refundedAmount,
      refundReason,
      returnStatus,
    } = body;

    const existing = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
      include: { items: true },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const updateData: {
      status?: string;
      paymentStatus?: string;
      refundedAmount?: number;
      refundReason?: string | null;
      refundedAt?: Date;
      returnStatus?: string;
    } = {};

    if (status) updateData.status = status;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;
    if (returnStatus) updateData.returnStatus = returnStatus;

    if (refundedAmount !== undefined) {
      updateData.refundedAmount = Number(refundedAmount);
      updateData.refundReason = refundReason ? String(refundReason).trim() : null;
      updateData.refundedAt = new Date();
      if (Number(refundedAmount) > 0) {
        updateData.paymentStatus = 'REFUNDED';
      }
    }

    if (status === 'CANCELLED' && existing.status !== 'CANCELLED') {
      await prisma.$transaction(async (tx) => {
        for (const item of existing.items) {
          const prod = await tx.product.findUnique({ where: { id: item.productId } });
          if (prod) {
            const restored = prod.stockQuantity + item.quantity;
            await tx.product.update({
              where: { id: prod.id },
              data: { stockQuantity: restored, inStock: true },
            });
            await tx.inventoryLog.create({
              data: {
                productId: prod.id,
                changeQuantity: item.quantity,
                newQuantity: restored,
                reason: 'ORDER_CANCELLED',
                note: `Restocked by admin cancelling order ${existing.orderNumber}`,
              },
            });
          }

          if (item.variantId) {
            const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
            if (variant) {
              const restoredVariant = variant.stockQuantity + item.quantity;
              await tx.productVariant.update({
                where: { id: variant.id },
                data: { stockQuantity: restoredVariant, inStock: true },
              });
              await tx.inventoryLog.create({
                data: {
                  productId: variant.productId,
                  changeQuantity: item.quantity,
                  newQuantity: restoredVariant,
                  reason: 'ORDER_CANCELLED',
                  note: `Variant ${variant.sku} restocked by admin cancelling order ${existing.orderNumber}`,
                },
              });
            }
          }
        }
      });
    }

    const updated = await prisma.order.update({
      where: { id: existing.id },
      data: updateData,
      include: { items: true, user: true },
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error('Order PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}
