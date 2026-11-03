import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { wishlistItemSchema } from '@meadowmist/shared';

export async function GET() {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ items: [] });
    }

    const items = await prisma.wishlistItem.findMany({
      where: { userId: session.userId },
      include: {
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Wishlist GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = wishlistItemSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const { productId } = parsed.data;

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const item = await prisma.wishlistItem.upsert({
      where: {
        userId_productId: {
          userId: session.userId,
          productId,
        },
      },
      update: {},
      create: {
        userId: session.userId,
        productId,
      },
      include: {
        product: true,
      },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = wishlistItemSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const { productId } = parsed.data;

    await prisma.wishlistItem.deleteMany({
      where: {
        userId: session.userId,
        productId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Wishlist DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
  }
}
