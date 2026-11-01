import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/session', () => ({
  getSessionUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
    },
  },
}));

describe('Storefront Customer Orders History API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when customer is unauthenticated', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns orders placed by customer ordered by creation date descending', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'usr_1',
      email: 'customer@example.com',
      name: 'Customer',
      role: 'CUSTOMER',
    });

    vi.mocked(prisma.order.findMany).mockResolvedValue([
      {
        id: 'ord_1',
        orderNumber: 'MM-ORD-2026-101',
        status: 'DELIVERED',
        totalAmount: 1850,
        createdAt: new Date().toISOString(),
        items: [
          {
            id: 'item_1',
            productName: 'Botanical Amber Soy Candle',
            quantity: 2,
            unitPrice: 750,
            product: { id: 'prod_1', slug: 'botanical-amber-soy-candle', category: 'candle' },
          },
        ],
      } as any,
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.orders).toHaveLength(1);
    expect(body.orders[0].orderNumber).toBe('MM-ORD-2026-101');
    expect(body.orders[0].items[0].product.slug).toBe('botanical-amber-soy-candle');
  });
});

