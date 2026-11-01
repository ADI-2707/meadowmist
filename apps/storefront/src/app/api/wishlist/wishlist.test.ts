import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST, DELETE } from './route';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/session', () => ({
  getSessionUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    wishlistItem: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Storefront Wishlist API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns empty items array when customer is unauthenticated', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual([]);
  });

  it('GET returns saved wishlist items for customer', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'usr_1',
      email: 'customer@example.com',
      name: 'Customer',
      role: 'CUSTOMER',
    });

    vi.mocked(prisma.wishlistItem.findMany).mockResolvedValue([
      {
        id: 'wish_1',
        productId: 'prod_1',
        product: { id: 'prod_1', name: 'Terracotta Pitcher', price: 1400 },
      } as any,
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].product.name).toBe('Terracotta Pitcher');
  });

  it('POST returns 401 when customer is unauthenticated', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'prod_1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST saves product to user wishlist', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'usr_1',
      email: 'customer@example.com',
      name: 'Customer',
      role: 'CUSTOMER',
    });

    vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: 'prod_1' } as any);
    vi.mocked(prisma.wishlistItem.upsert).mockResolvedValue({
      id: 'wish_1',
      productId: 'prod_1',
      userId: 'usr_1',
      product: { id: 'prod_1', name: 'Terracotta Pitcher' },
    } as any);

    const req = new Request('http://localhost:3000/api/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'prod_1' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.item.id).toBe('wish_1');
  });

  it('DELETE removes product from customer wishlist', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'usr_1',
      email: 'customer@example.com',
      name: 'Customer',
      role: 'CUSTOMER',
    });

    const req = new Request('http://localhost:3000/api/wishlist', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'prod_1' }),
    });

    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(prisma.wishlistItem.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'usr_1', productId: 'prod_1' },
    });
  });
});

