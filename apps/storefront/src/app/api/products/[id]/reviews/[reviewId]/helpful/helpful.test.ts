import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/session';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    review: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    reviewHelpfulVote: {
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock('@/lib/session', () => ({
  getSessionUser: vi.fn(),
}));

describe('Review Helpful Vote API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/products/p1/reviews/r1/helpful', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'p1', reviewId: 'r1' }) });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('logged in');
  });

  it('returns 404 when review is not found', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({ userId: 'u1', email: 'u@test.com', role: 'CUSTOMER' });
    vi.mocked(prisma.review.findUnique).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/products/p1/reviews/missing/helpful', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'p1', reviewId: 'missing' }) });

    expect(res.status).toBe(404);
  });

  it('toggles vote on when user has not voted yet', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({ userId: 'u1', email: 'u@test.com', role: 'CUSTOMER' });
    vi.mocked(prisma.review.findUnique).mockResolvedValue({ id: 'r1', helpfulCount: 4 } as any);
    vi.mocked(prisma.reviewHelpfulVote.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.$transaction).mockResolvedValue([
      { id: 'v1' },
      { helpfulCount: 5 },
    ] as any);

    const req = new Request('http://localhost:3000/api/products/p1/reviews/r1/helpful', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'p1', reviewId: 'r1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.voted).toBe(true);
    expect(body.helpfulCount).toBe(5);
  });

  it('toggles vote off when user previously voted', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({ userId: 'u1', email: 'u@test.com', role: 'CUSTOMER' });
    vi.mocked(prisma.review.findUnique).mockResolvedValue({ id: 'r1', helpfulCount: 5 } as any);
    vi.mocked(prisma.reviewHelpfulVote.findUnique).mockResolvedValue({ id: 'v1', reviewId: 'r1', userId: 'u1' } as any);
    vi.mocked(prisma.$transaction).mockResolvedValue([
      { id: 'v1' },
      { helpfulCount: 4 },
    ] as any);

    const req = new Request('http://localhost:3000/api/products/p1/reviews/r1/helpful', { method: 'POST' });
    const res = await POST(req, { params: Promise.resolve({ id: 'p1', reviewId: 'r1' }) });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.voted).toBe(false);
    expect(body.helpfulCount).toBe(4);
  });
});

