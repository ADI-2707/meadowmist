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
    const { reason, returnStatus } = body;

    const session = await getSessionUser();
    const admin = await getAdminSessionUser();

    if (!session && !admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!admin && order.userId !== session?.userId) {
      return NextResponse.json({ error: 'Unauthorized to request return for this order' }, { status: 403 });
    }

    if (!admin && order.status !== 'DELIVERED') {
      return NextResponse.json(
        { error: 'Return can only be requested for delivered orders' },
        { status: 400 }
      );
    }

    const targetStatus = admin && returnStatus ? String(returnStatus) : 'REQUESTED';
    const targetReason = reason ? String(reason).trim() : (order.returnReason || 'Defective or damaged item');

    const updated = await prisma.order.update({
      where: { id },
      data: {
        returnStatus: targetStatus,
        returnReason: targetReason,
        returnRequestedAt: order.returnRequestedAt || new Date(),
      },
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error('Order return error:', error);
    return NextResponse.json({ error: 'Failed to request return' }, { status: 500 });
  }
}
