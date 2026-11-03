import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { CourierTrackingUpdate } from '@/lib/shipping/types';

function isValidSecret(provided: string | null, expected: string): boolean {
  if (!provided) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  if (providedBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return crypto.timingSafeEqual(providedBuffer, expectedBuffer);
}

export async function POST(request: Request) {
  try {
    const configuredSecret = process.env.SHIPPING_WEBHOOK_SECRET;
    if (configuredSecret) {
      const incomingSecret =
        request.headers.get('x-webhook-secret') ||
        request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

      if (!isValidSecret(incomingSecret || null, configuredSecret)) {
        return NextResponse.json({ error: 'Unauthorized webhook call' }, { status: 401 });
      }
    } else if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const body: CourierTrackingUpdate = await request.json();
    const { trackingNumber, courierStatus, delivered } = body;

    if (!trackingNumber) {
      return NextResponse.json({ error: 'trackingNumber is required' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { trackingNumber },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found for tracking number' }, { status: 404 });
    }

    const updateData: { courierStatus: string; status?: string } = {
      courierStatus,
    };

    if (delivered || courierStatus?.toLowerCase().includes('delivered')) {
      updateData.status = 'DELIVERED';
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: updateData,
    });

    return NextResponse.json({ success: true, orderId: updated.id, status: updated.status });
  } catch (error) {
    console.error('Shipping webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
