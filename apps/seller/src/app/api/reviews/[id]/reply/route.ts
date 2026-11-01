import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSessionUser } from '@/lib/session';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const admin = await getAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    if (!body || typeof body.reply !== 'string' || !body.reply.trim()) {
      return NextResponse.json({ error: 'Reply text cannot be empty' }, { status: 400 });
    }

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        sellerReply: body.reply.trim(),
        sellerRepliedAt: new Date(),
      },
    });

    return NextResponse.json({ review: updated });
  } catch (error) {
    console.error('Seller artisan reply POST error:', error);
    return NextResponse.json({ error: 'Failed to save artisan reply' }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  return POST(request, context);
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const admin = await getAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: {
        sellerReply: null,
        sellerRepliedAt: null,
      },
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (error) {
    console.error('Seller artisan reply DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete artisan reply' }, { status: 500 });
  }
}

