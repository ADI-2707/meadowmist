import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

interface RouteContext {
  params: Promise<{ id: string; reviewId: string }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'You must be logged in to vote on reviews' }, { status: 401 });
    }

    const { reviewId } = await context.params;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, helpfulCount: true },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const existingVote = await prisma.reviewHelpfulVote.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId: session.userId,
        },
      },
    });

    if (existingVote) {
      const [_, updated] = await prisma.$transaction([
        prisma.reviewHelpfulVote.delete({
          where: { id: existingVote.id },
        }),
        prisma.review.update({
          where: { id: reviewId },
          data: {
            helpfulCount: Math.max(0, review.helpfulCount - 1),
          },
          select: { helpfulCount: true },
        }),
      ]);

      return NextResponse.json({ voted: false, helpfulCount: updated.helpfulCount });
    }

    const [_, updated] = await prisma.$transaction([
      prisma.reviewHelpfulVote.create({
        data: {
          reviewId,
          userId: session.userId,
        },
      }),
      prisma.review.update({
        where: { id: reviewId },
        data: {
          helpfulCount: review.helpfulCount + 1,
        },
        select: { helpfulCount: true },
      }),
    ]);

    return NextResponse.json({ voted: true, helpfulCount: updated.helpfulCount });
  } catch (error) {
    console.error('Helpful vote error:', error);
    return NextResponse.json({ error: 'Failed to record helpful vote' }, { status: 500 });
  }
}

