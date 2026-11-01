import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from './route';
import { getAdminSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/session', () => ({
  getAdminSessionUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
    },
    productVariant: {
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('Seller Inventory API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns 401 when admin is unauthenticated', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue(null);

    const req = new Request('http://localhost:3001/api/inventory');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('GET returns inventory metrics and products with restock alerts count', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.product.findMany)
      .mockResolvedValueOnce([
        { id: 'prod_1', price: 900, salePrice: null, stockQuantity: 2, category: 'candle', lowStockThreshold: 5 },
        { id: 'prod_2', price: 1500, salePrice: null, stockQuantity: 0, category: 'ceramic', lowStockThreshold: 3 },
      ] as any)
      .mockResolvedValueOnce([
        {
          id: 'prod_1',
          name: 'Amber Soy Candle',
          stockQuantity: 2,
          _count: { restockAlerts: 4 },
        },
      ] as any);

    vi.mocked(prisma.product.count).mockResolvedValue(1);

    const req = new Request('http://localhost:3001/api/inventory?page=1&limit=10');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary.totalCandles).toBe(2);
    expect(body.summary.totalCeramics).toBe(0);
    expect(body.summary.outOfStockCount).toBe(1);
    expect(body.products).toHaveLength(1);
  });

  it('PATCH returns 400 when neither productId nor variantId is provided', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    const req = new Request('http://localhost:3001/api/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newQuantity: 10 }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it('PATCH updates product stock and logs inventory adjustment', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      id: 'prod_1',
      stockQuantity: 5,
    } as any);

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const txMock = {
        product: {
          update: vi.fn().mockResolvedValue({ id: 'prod_1', stockQuantity: 15, inStock: true }),
        },
        inventoryLog: {
          create: vi.fn().mockResolvedValue({ id: 'log_10' }),
        },
      };
      return callback(txMock);
    });

    const req = new Request('http://localhost:3001/api/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'prod_1',
        newQuantity: 15,
        reason: 'RESTOCK',
        note: 'Fresh kiln batch',
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.product.stockQuantity).toBe(15);
  });

  it('PATCH updates variant stock directly when variantId is provided', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.productVariant.findUnique).mockResolvedValue({
      id: 'var_1',
      productId: 'prod_1',
      sku: 'VAR-100',
      stockQuantity: 3,
    } as any);

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const txMock = {
        productVariant: {
          update: vi.fn().mockResolvedValue({ id: 'var_1', stockQuantity: 8, inStock: true }),
        },
        inventoryLog: {
          create: vi.fn().mockResolvedValue({ id: 'log_11' }),
        },
      };
      return callback(txMock);
    });

    const req = new Request('http://localhost:3001/api/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        variantId: 'var_1',
        changeQuantity: 5,
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.variant.stockQuantity).toBe(8);
  });
});
