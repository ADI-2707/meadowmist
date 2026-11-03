import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { cartItemSchema } from '@meadowmist/shared';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ items: [] });
    }

    const items = await prisma.cartItem.findMany({
      where: { userId: session.userId },
      include: {
        product: {
          select: {
            id: true,
            slug: true,
            name: true,
            price: true,
            salePrice: true,
            images: true,
            category: true,
            stockQuantity: true,
            inStock: true,
          },
        },
      },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Cart get error:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = cartItemSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const { productId, quantity } = parsed.data;

    if (quantity <= 0) {
      await prisma.cartItem.deleteMany({
        where: {
          userId: session.userId,
          productId,
        },
      });
      return NextResponse.json({ success: true, removed: true });
    }

    const item = await prisma.cartItem.upsert({
      where: {
        userId_productId: {
          userId: session.userId,
          productId,
        },
      },
      update: { quantity },
      create: {
        userId: session.userId,
        productId,
        quantity,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Cart update error:', error);
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.cartItem.deleteMany({
      where: { userId: session.userId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cart clear error:', error);
    return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 });
  }
}
