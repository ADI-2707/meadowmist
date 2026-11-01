import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from './route';
import { POST as syncCart } from './sync/route';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/session', () => ({
  getSessionUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    cartItem: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      deleteMany: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Storefront Cart and Sync API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns empty items array when customer is guest', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toEqual([]);
  });

  it('GET returns cart items with product snapshot for authenticated user', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'usr_1',
      email: 'customer@example.com',
      name: 'Customer',
      role: 'CUSTOMER',
    });

    vi.mocked(prisma.cartItem.findMany).mockResolvedValue([
      {
        id: 'cart_1',
        productId: 'prod_1',
        quantity: 2,
        product: {
          id: 'prod_1',
          name: 'Lavender Soy Candle',
          price: 750,
          inStock: true,
        },
      } as any,
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(body.items[0].product.name).toBe('Lavender Soy Candle');
  });

  it('PUT removes item when quantity is zero or less', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'usr_1',
      email: 'customer@example.com',
      name: 'Customer',
      role: 'CUSTOMER',
    });

    const req = new Request('http://localhost:3000/api/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'prod_1', quantity: 0 }),
    });

    const res = await PUT(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.removed).toBe(true);
    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'usr_1', productId: 'prod_1' },
    });
  });

  it('PUT upserts item with quantity when positive', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'usr_1',
      email: 'customer@example.com',
      name: 'Customer',
      role: 'CUSTOMER',
    });

    vi.mocked(prisma.cartItem.upsert).mockResolvedValue({
      id: 'cart_1',
      productId: 'prod_1',
      quantity: 3,
    } as any);

    const req = new Request('http://localhost:3000/api/cart', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'prod_1', quantity: 3 }),
    });

    const res = await PUT(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.item.quantity).toBe(3);
  });

  it('DELETE empties user cart', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'usr_1',
      email: 'customer@example.com',
      name: 'Customer',
      role: 'CUSTOMER',
    });

    const res = await DELETE();
    expect(res.status).toBe(200);
    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'usr_1' },
    });
  });

  it('POST /api/cart/sync merges guest items into database', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'usr_1',
      email: 'customer@example.com',
      name: 'Customer',
      role: 'CUSTOMER',
    });

    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      id: 'prod_1',
      name: 'Lavender Candle',
    } as any);

    vi.mocked(prisma.cartItem.upsert).mockResolvedValue({
      id: 'cart_synced',
    } as any);

    vi.mocked(prisma.cartItem.findMany).mockResolvedValue([
      {
        id: 'cart_synced',
        productId: 'prod_1',
        quantity: 2,
        product: { id: 'prod_1', name: 'Lavender Candle' },
      } as any,
    ]);

    const req = new Request('http://localhost:3000/api/cart/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'prod_1', quantity: 2 }],
      }),
    });

    const res = await syncCart(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.items).toHaveLength(1);
    expect(prisma.cartItem.upsert).toHaveBeenCalled();
  });
});
