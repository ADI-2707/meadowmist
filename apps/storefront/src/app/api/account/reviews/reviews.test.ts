import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    review: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/session', () => ({
  getSessionUser: vi.fn(),
}));

describe('Customer Account Reviews API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests with 401', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
    expect(prisma.review.findMany).not.toHaveBeenCalled();
  });

  it('returns user reviews with associated product information', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'user-42',
      email: 'collector@example.com',
      role: 'CUSTOMER',
    });

    const mockReviews = [
      {
        id: 'rev-1',
        rating: 5,
        title: 'Exquisite aroma',
        comment: 'Fills the sanctuary with peace.',
        isVerifiedPurchase: true,
        isApproved: true,
        createdAt: new Date(),
        product: {
          id: 'prod-1',
          name: 'Himalayan Cedarwood Candle',
          slug: 'himalayan-cedarwood-candle',
          images: '["/images/cedar.jpg"]',
          category: 'CANDLES',
        },
      },
    ];
    vi.mocked(prisma.review.findMany).mockResolvedValue(mockReviews as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reviews).toHaveLength(1);
    expect(body.reviews[0].product.name).toBe('Himalayan Cedarwood Candle');
    expect(prisma.review.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-42' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            images: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('handles database exceptions with 500', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'user-42',
      email: 'collector@example.com',
      role: 'CUSTOMER',
    });
    vi.mocked(prisma.review.findMany).mockRejectedValue(new Error('DB failure'));

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch customer reviews');
  });
});
