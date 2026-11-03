import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';
import { parsePaginationParams } from '@meadowmist/shared';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const CANDLE_ASPECTS: Record<string, string> = {
  scent: 'Scent Throw',
  longevity: 'Burn Longevity',
  packaging: 'Packaging Quality',
};

const CERAMIC_ASPECTS: Record<string, string> = {
  craftsmanship: 'Craftsmanship & Texture',
  finish: 'Glaze Finish',
  durability: 'Durability & Weight',
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);

    const sort = searchParams.get('sort') || 'recent';
    const ratingParam = searchParams.get('rating');
    const verifiedParam = searchParams.get('verified');
    const withPhotosParam = searchParams.get('withPhotos');
    const search = searchParams.get('search')?.trim();

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true, category: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const session = await getSessionUser();

    const allApprovedReviews = await prisma.review.findMany({
      where: {
        productId: product.id,
        isApproved: true,
      },
      select: {
        id: true,
        rating: true,
        images: true,
        aspectRatings: true,
        comment: true,
        user: { select: { name: true } },
      },
    });

    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    const customerPhotos: Array<{
      url: string;
      reviewId: string;
      authorName: string;
      rating: number;
      comment: string;
    }> = [];

    const aspectTotals: Record<string, { sum: number; count: number }> = {};
    const aspectDefinitions = product.category === 'candle' ? CANDLE_ASPECTS : CERAMIC_ASPECTS;

    for (const r of allApprovedReviews) {
      counts[r.rating] = (counts[r.rating] || 0) + 1;
      sum += r.rating;

      if (r.images) {
        try {
          const parsed = JSON.parse(r.images);
          if (Array.isArray(parsed)) {
            for (const imgUrl of parsed) {
              if (imgUrl) {
                customerPhotos.push({
                  url: imgUrl,
                  reviewId: r.id,
                  authorName: r.user?.name || 'Collector',
                  rating: r.rating,
                  comment: r.comment,
                });
              }
            }
          }
        } catch {}
      }

      if (r.aspectRatings) {
        try {
          const parsedAspects = JSON.parse(r.aspectRatings);
          for (const [key, val] of Object.entries(parsedAspects)) {
            const num = Number(val);
            if (num >= 1 && num <= 5) {
              if (!aspectTotals[key]) {
                aspectTotals[key] = { sum: 0, count: 0 };
              }
              aspectTotals[key].sum += num;
              aspectTotals[key].count += 1;
            }
          }
        } catch {}
      }
    }

    const aspectScores = Object.entries(aspectDefinitions).map(([key, name]) => {
      const data = aspectTotals[key];
      const avg = data && data.count > 0 ? Number((data.sum / data.count).toFixed(1)) : 0;
      return {
        key,
        name,
        average: avg,
        count: data ? data.count : 0,
      };
    });

    const total = allApprovedReviews.length;
    const average = total > 0 ? Number((sum / total).toFixed(1)) : 0;

    const whereClause: any = {
      productId: product.id,
      isApproved: true,
    };

    if (ratingParam) {
      const parsedRating = parseInt(ratingParam, 10);
      if (parsedRating >= 1 && parsedRating <= 5) {
        whereClause.rating = parsedRating;
      }
    }

    if (verifiedParam === 'true') {
      whereClause.isVerifiedPurchase = true;
    }

    if (withPhotosParam === 'true') {
      whereClause.images = { not: null };
    }

    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { comment: { contains: search } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort === 'highest') {
      orderBy = [{ rating: 'desc' }, { createdAt: 'desc' }];
    } else if (sort === 'lowest') {
      orderBy = [{ rating: 'asc' }, { createdAt: 'desc' }];
    } else if (sort === 'helpful') {
      orderBy = [{ helpfulCount: 'desc' }, { createdAt: 'desc' }];
    }

    const pageParam = searchParams.get('page');
    const limitParam = searchParams.get('limit');
    const isPaginated = pageParam !== null || limitParam !== null;
    const { page, limit, skip } = parsePaginationParams(searchParams, 5, 50);

    const [filteredCount, filteredReviews] = await Promise.all([
      prisma.review.count({ where: whereClause }),
      prisma.review.findMany({
        where: whereClause,
        orderBy,
        include: {
          user: {
            select: { name: true },
          },
        },
        ...(isPaginated ? { skip, take: limit } : {}),
      }),
    ]);

    let userVotedIds = new Set<string>();
    if (session) {
      const votes = await prisma.reviewHelpfulVote.findMany({
        where: {
          userId: session.userId,
          reviewId: { in: filteredReviews.map((r) => r.id) },
        },
        select: { reviewId: true },
      });
      userVotedIds = new Set(votes.map((v) => v.reviewId));
    }

    const formattedReviews = filteredReviews.map((r) => {
      let parsedImages: string[] = [];
      if (r.images) {
        try {
          const parsed = JSON.parse(r.images);
          if (Array.isArray(parsed)) parsedImages = parsed;
        } catch {}
      }

      let parsedAspects: Record<string, number> | null = null;
      if (r.aspectRatings) {
        try {
          parsedAspects = JSON.parse(r.aspectRatings);
        } catch {}
      }

      return {
        id: r.id,
        productId: r.productId,
        userId: r.userId,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        images: parsedImages,
        helpfulCount: r.helpfulCount,
        sellerReply: r.sellerReply,
        sellerRepliedAt: r.sellerRepliedAt ? r.sellerRepliedAt.toISOString() : null,
        aspectRatings: parsedAspects,
        userVotedHelpful: userVotedIds.has(r.id),
        isVerifiedPurchase: r.isVerifiedPurchase,
        isApproved: r.isApproved,
        createdAt: r.createdAt.toISOString(),
        user: r.user,
      };
    });

    const totalPages = isPaginated ? Math.ceil(filteredCount / limit) : 1;

    return NextResponse.json({
      reviews: formattedReviews,
      customerPhotos,
      distribution: {
        average,
        total,
        counts,
        aspectScores,
        photoCount: customerPhotos.length,
      },
      pagination: {
        page: isPaginated ? page : 1,
        limit: isPaginated ? limit : filteredCount,
        total: filteredCount,
        totalPages,
        hasNext: isPaginated ? page < totalPages : false,
        hasPrev: isPaginated ? page > 1 : false,
      },
    });
  } catch (error) {
    console.error('Reviews GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json({ error: 'You must be logged in to leave a review' }, { status: 401 });
    }

    const { id } = await context.params;

    const product = await prisma.product.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const body = await request.json();
    const rating = Number(body.rating);
    const title = body.title ? String(body.title).trim() : null;
    const comment = body.comment ? String(body.comment).trim() : '';
    const images = Array.isArray(body.images) ? body.images.slice(0, 3) : [];
    const aspectRatings = body.aspectRatings && typeof body.aspectRatings === 'object' ? body.aspectRatings : null;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be an integer between 1 and 5' }, { status: 400 });
    }

    if (!comment || comment.length < 5) {
      return NextResponse.json({ error: 'Review comment must be at least 5 characters long' }, { status: 400 });
    }

    const orderItem = await prisma.orderItem.findFirst({
      where: {
        productId: product.id,
        order: {
          userId: session.userId,
          status: { in: ['DELIVERED', 'SHIPPED', 'PROCESSING'] },
        },
      },
    });

    const isVerifiedPurchase = Boolean(orderItem);

    const imagesString = images.length > 0 ? JSON.stringify(images) : null;
    const aspectRatingsString = aspectRatings ? JSON.stringify(aspectRatings) : null;

    const review = await prisma.review.upsert({
      where: {
        productId_userId: {
          productId: product.id,
          userId: session.userId,
        },
      },
      create: {
        productId: product.id,
        userId: session.userId,
        rating,
        title,
        comment,
        images: imagesString,
        aspectRatings: aspectRatingsString,
        isVerifiedPurchase,
        isApproved: true,
      },
      update: {
        rating,
        title,
        comment,
        images: imagesString,
        aspectRatings: aspectRatingsString,
        isVerifiedPurchase,
        isApproved: true,
      },
      include: {
        user: {
          select: { name: true },
        },
      },
    });

    let parsedImages: string[] = [];
    if (review.images) {
      try {
        const parsed = JSON.parse(review.images);
        if (Array.isArray(parsed)) parsedImages = parsed;
      } catch {}
    }

    let parsedAspects: Record<string, number> | null = null;
    if (review.aspectRatings) {
      try {
        parsedAspects = JSON.parse(review.aspectRatings);
      } catch {}
    }

    const formattedReview = {
      id: review.id,
      productId: review.productId,
      userId: review.userId,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      images: parsedImages,
      helpfulCount: review.helpfulCount,
      sellerReply: review.sellerReply,
      sellerRepliedAt: review.sellerRepliedAt ? review.sellerRepliedAt.toISOString() : null,
      aspectRatings: parsedAspects,
      userVotedHelpful: false,
      isVerifiedPurchase: review.isVerifiedPurchase,
      isApproved: review.isApproved,
      createdAt: review.createdAt.toISOString(),
      user: review.user,
    };

    return NextResponse.json({ review: formattedReview }, { status: 201 });
  } catch (error) {
    console.error('Reviews POST error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
