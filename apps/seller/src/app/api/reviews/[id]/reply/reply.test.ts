import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, PATCH, DELETE } from './route';
import { getAdminSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/session', () => ({
  getAdminSessionUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    review: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Artisan Review Reply API', () => {
  const adminUser = {
    userId: 'admin_1',
    email: 'artisan@meadowmist.in',
    name: 'Master Artisan',
    role: 'ADMIN',
  };

  const context = {
    params: Promise.resolve({ id: 'rev-101' }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST returns 401 when artisan is unauthenticated', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue(null);

    const req = new Request('http://localhost:3001/api/reviews/rev-101/reply', {
      method: 'POST',
      body: JSON.stringify({ reply: 'Thank you for your review!' }),
    });

    const res = await POST(req, context);
    expect(res.status).toBe(401);
  });

  it('POST returns 400 when reply content is empty', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue(adminUser);

    const req = new Request('http://localhost:3001/api/reviews/rev-101/reply', {
      method: 'POST',
      body: JSON.stringify({ reply: '   ' }),
    });

    const res = await POST(req, context);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Reply text cannot be empty');
  });

  it('POST returns 404 when review does not exist', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue(adminUser);
    vi.mocked(prisma.review.findUnique).mockResolvedValue(null);

    const req = new Request('http://localhost:3001/api/reviews/rev-101/reply', {
      method: 'POST',
      body: JSON.stringify({ reply: 'Thank you for your warm words.' }),
    });

    const res = await POST(req, context);
    expect(res.status).toBe(404);
  });

  it('POST successfully updates seller reply and timestamp', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue(adminUser);
    vi.mocked(prisma.review.findUnique).mockResolvedValue({
      id: 'rev-101',
      comment: 'Beautiful candle',
    } as any);

    const mockUpdated = {
      id: 'rev-101',
      sellerReply: 'Thank you so much! We poured this batch with extra care.',
      sellerRepliedAt: new Date(),
    };
    vi.mocked(prisma.review.update).mockResolvedValue(mockUpdated as any);

    const req = new Request('http://localhost:3001/api/reviews/rev-101/reply', {
      method: 'POST',
      body: JSON.stringify({ reply: 'Thank you so much! We poured this batch with extra care.' }),
    });

    const res = await POST(req, context);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.review.sellerReply).toBe('Thank you so much! We poured this batch with extra care.');
    expect(prisma.review.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rev-101' },
        data: expect.objectContaining({
          sellerReply: 'Thank you so much! We poured this batch with extra care.',
        }),
      })
    );
  });

  it('PATCH delegates to POST logic cleanly', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue(adminUser);
    vi.mocked(prisma.review.findUnique).mockResolvedValue({ id: 'rev-101' } as any);
    vi.mocked(prisma.review.update).mockResolvedValue({ id: 'rev-101', sellerReply: 'Updated reply' } as any);

    const req = new Request('http://localhost:3001/api/reviews/rev-101/reply', {
      method: 'PATCH',
      body: JSON.stringify({ reply: 'Updated reply' }),
    });

    const res = await PATCH(req, context);
    expect(res.status).toBe(200);
  });

  it('DELETE clears seller reply and timestamp', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue(adminUser);
    vi.mocked(prisma.review.findUnique).mockResolvedValue({ id: 'rev-101' } as any);
    vi.mocked(prisma.review.update).mockResolvedValue({
      id: 'rev-101',
      sellerReply: null,
      sellerRepliedAt: null,
    } as any);

    const req = new Request('http://localhost:3001/api/reviews/rev-101/reply', {
      method: 'DELETE',
    });

    const res = await DELETE(req, context);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(prisma.review.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rev-101' },
        data: {
          sellerReply: null,
          sellerRepliedAt: null,
        },
      })
    );
  });
});
