import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/session', () => ({
  getSessionUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Storefront /api/auth/me Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null user when session cookie is absent', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user).toBeNull();
  });

  it('returns authenticated user profile with relationship counts', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'usr_1',
      email: 'ananya@example.com',
      name: 'Ananya Rao',
      role: 'CUSTOMER',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'usr_1',
      name: 'Ananya Rao',
      email: 'ananya@example.com',
      phone: '+919876543210',
      role: 'CUSTOMER',
      createdAt: new Date().toISOString(),
      _count: {
        orders: 3,
        wishlistItems: 5,
        addresses: 2,
      },
    } as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.name).toBe('Ananya Rao');
    expect(body.user._count.orders).toBe(3);
  });
});
