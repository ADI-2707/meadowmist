import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: productId } = await context.params;
    const body = await request.json();
    const { email, variantId } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
      });

      if (!variant || variant.productId !== productId) {
        return NextResponse.json({ error: 'Selected variant not found for this product' }, { status: 400 });
      }
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existing = await prisma.restockNotification.findFirst({
      where: {
        productId,
        variantId: variantId || null,
        email: normalizedEmail,
      },
    });

    if (existing) {
      return NextResponse.json({
        success: true,
        alreadyRegistered: true,
        message: "You're already on the notification list for this piece. We will email you the moment it restocks.",
      });
    }

    const notification = await prisma.restockNotification.create({
      data: {
        productId,
        variantId: variantId || null,
        email: normalizedEmail,
      },
    });

    return NextResponse.json(
      {
        success: true,
        notification,
        message: "Thank you! We'll notify you as soon as this small-batch piece is available.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Restock alert error:', error);
    return NextResponse.json({ error: 'Failed to register restock notification' }, { status: 500 });
  }
}

