import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const settings = await prisma.storeSettings.findUnique({
      where: { id: 'default' },
      select: {
        storeName: true,
        contactEmail: true,
        contactPhone: true,
        shippingFlatRate: true,
        freeShippingThreshold: true,
        codEnabled: true,
        codFee: true,
      },
    });

    return NextResponse.json({
      settings: settings || {
        storeName: 'Meadow Mist',
        contactEmail: 'hello@meadowmist.in',
        contactPhone: '+91 98765 43210',
        shippingFlatRate: 99,
        freeShippingThreshold: 1499,
        codEnabled: true,
        codFee: 0,
      },
    });
  } catch {
    return NextResponse.json(
      {
        settings: {
          storeName: 'Meadow Mist',
          contactEmail: 'hello@meadowmist.in',
          contactPhone: '+91 98765 43210',
          shippingFlatRate: 99,
          freeShippingThreshold: 1499,
          codEnabled: true,
          codFee: 0,
        },
      },
      { status: 200 }
    );
  }
}
