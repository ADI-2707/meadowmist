import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findFirst: vi.fn(),
    },
    review: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
    },
    reviewHelpfulVote: {
      findMany: vi.fn(),
    },
    orderItem: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('@/lib/session', () => ({
  getSessionUser: vi.fn(),
}));

describe('Product Reviews API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns 404 when product is not found', async () => {
    vi.mocked(prisma.product.findFirst).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/products/non-existent/reviews');
    const res = await GET(req, { params: Promise.resolve({ id: 'non-existent' }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Product not found');
  });

  it('GET calculates average rating and distribution counts correctly', async () => {
    vi.mocked(prisma.product.findFirst).mockResolvedValue({ id: 'prod-1', category: 'candle' } as any);
    vi.mocked(prisma.review.findMany).mockResolvedValue([
      { id: 'rev-1', rating: 5, comment: 'Amazing', createdAt: new Date() } as any,
      { id: 'rev-2', rating: 4, comment: 'Great', createdAt: new Date() } as any,
      { id: 'rev-3', rating: 5, comment: 'Loved it', createdAt: new Date() } as any,
    ]);

    const req = new Request('http://localhost:3000/api/products/prod-1/reviews');
    const res = await GET(req, { params: Promise.resolve({ id: 'prod-1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reviews).toHaveLength(3);
    expect(body.distribution.total).toBe(3);
    expect(body.distribution.average).toBe(4.7);
    expect(body.distribution.counts[5]).toBe(2);
    expect(body.distribution.counts[4]).toBe(1);
    expect(body.distribution.counts[1]).toBe(0);
  });

  it('POST returns 401 when user is not authenticated', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/products/prod-1/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 5, comment: 'Wonderful piece' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: 'prod-1' }) });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('You must be logged in to leave a review');
  });

  it('POST returns 400 when rating is out of range', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({ userId: 'user-1', email: 'u@test.com', role: 'CUSTOMER' });
    vi.mocked(prisma.product.findFirst).mockResolvedValue({ id: 'prod-1' } as any);

    const req = new Request('http://localhost:3000/api/products/prod-1/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 6, comment: 'Invalid rating test' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: 'prod-1' }) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('between 1 and 5');
  });

  it('POST creates verified review when user previously ordered the item', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({ userId: 'user-1', email: 'u@test.com', role: 'CUSTOMER' });
    vi.mocked(prisma.product.findFirst).mockResolvedValue({ id: 'prod-1' } as any);
    vi.mocked(prisma.orderItem.findFirst).mockResolvedValue({ id: 'order-item-1' } as any);
    vi.mocked(prisma.review.upsert).mockResolvedValue({
      id: 'rev-new',
      productId: 'prod-1',
      userId: 'user-1',
      rating: 5,
      comment: 'Authentic handmade delight',
      images: null,
      helpfulCount: 0,
      sellerReply: null,
      sellerRepliedAt: null,
      aspectRatings: null,
      isVerifiedPurchase: true,
      isApproved: true,
      createdAt: new Date(),
      user: { name: 'Aditi' },
    } as any);

    const req = new Request('http://localhost:3000/api/products/prod-1/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: 5, comment: 'Authentic handmade delight' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: 'prod-1' }) });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.review.isVerifiedPurchase).toBe(true);
    expect(prisma.review.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          isVerifiedPurchase: true,
          rating: 5,
        }),
      })
    );
  });
});
