import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { prisma } from '@/lib/prisma';
import { getAdminSessionUser } from '@/lib/session';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    newsletterSubscriber: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/lib/session', () => ({
  getAdminSessionUser: vi.fn(),
}));

describe('Seller Newsletter Subscribers API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated requests with 401', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
    expect(prisma.newsletterSubscriber.findMany).not.toHaveBeenCalled();
  });

  it('returns subscriber list for authenticated admin', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin-1',
      email: 'admin@meadowmist.in',
      role: 'ADMIN',
    });

    const mockSubscribers = [
      { id: 'sub-1', email: 'patron1@example.com', isActive: true, createdAt: new Date() },
      { id: 'sub-2', email: 'patron2@example.com', isActive: true, createdAt: new Date() },
    ];
    vi.mocked(prisma.newsletterSubscriber.findMany).mockResolvedValue(mockSubscribers);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.subscribers).toHaveLength(2);
    expect(body.subscribers[0].email).toBe('patron1@example.com');
  });

  it('handles database errors gracefully with 500', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin-1',
      email: 'admin@meadowmist.in',
      role: 'ADMIN',
    });
    vi.mocked(prisma.newsletterSubscriber.findMany).mockRejectedValue(new Error('DB failure'));

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch subscribers');
  });
});
