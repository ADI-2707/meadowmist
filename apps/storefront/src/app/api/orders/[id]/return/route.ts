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
    const {
      reason = 'Defective or damaged item',
      resolutionPreference = 'REFUND',
      notes = '',
      images = [],
    } = body;

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

    if (order.status !== 'DELIVERED') {
      return NextResponse.json(
        { error: 'Return can only be requested for delivered orders' },
        { status: 400 }
      );
    }

    if (order.returnStatus && order.returnStatus !== 'NONE') {
      return NextResponse.json(
        { error: `Return request already ${order.returnStatus.toLowerCase()} for this order` },
        { status: 400 }
      );
    }

    const deliveryDate = order.updatedAt ? new Date(order.updatedAt) : new Date();
    const elapsedMs = Date.now() - deliveryDate.getTime();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    if (elapsedMs > SEVEN_DAYS_MS) {
      return NextResponse.json(
        { error: 'Return window has expired. Returns must be requested within 7 days of delivery.' },
        { status: 400 }
      );
    }

    const isDamage = /damag|break|crack/i.test(String(reason));
    const TWO_DAYS_MS = 48 * 60 * 60 * 1000;
    if (isDamage && elapsedMs > TWO_DAYS_MS) {
      return NextResponse.json(
        { error: 'Transit damage and breakage must be reported within 48 hours of delivery.' },
        { status: 400 }
      );
    }

    let returnImagesStr: string | null = null;
    if (Array.isArray(images) && images.length > 0) {
      returnImagesStr = JSON.stringify(images.slice(0, 3));
    }

    const formattedReason = `${String(reason).trim()} [Preference: ${resolutionPreference}]${notes ? ` - ${String(notes).trim()}` : ''}`;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        returnStatus: 'REQUESTED',
        returnReason: formattedReason,
        returnImages: returnImagesStr,
        returnRequestedAt: new Date(),
      },
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error('Order return error:', error);
    return NextResponse.json({ error: 'Failed to request return' }, { status: 500 });
  }
}
