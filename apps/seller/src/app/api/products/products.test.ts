import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
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
    $transaction: vi.fn(),
  },
}));

describe('Seller Products API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns products with pagination and category filter', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { id: 'prod_1', name: 'Ceramic Pitcher', category: 'ceramic' } as any,
    ]);
    vi.mocked(prisma.product.count).mockResolvedValue(1);

    const req = new Request('http://localhost:3001/api/products?category=ceramic&page=1&limit=10');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.products).toHaveLength(1);
    expect(body.pagination.total).toBe(1);
  });

  it('POST returns 401 when admin is unauthenticated', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue(null);

    const req = new Request('http://localhost:3001/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ceramic Vase' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('POST returns 400 when required fields are missing', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    const req = new Request('http://localhost:3001/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ceramic Vase' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('required');
  });

  it('POST returns 409 when product slug conflicts with existing product', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.product.findUnique).mockResolvedValue({ id: 'existing_prod' } as any);

    const req = new Request('http://localhost:3001/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Wild Honey Candle',
        slug: 'wild-honey-candle',
        price: 850,
        category: 'candle',
        subCategory: 'jar-candles',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it('POST creates product and logs initial inventory when valid', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

    const createdProduct = {
      id: 'prod_99',
      name: 'Earthen Mug',
      slug: 'earthen-mug',
      price: 1100,
      stockQuantity: 15,
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const txMock = {
        product: {
          create: vi.fn().mockResolvedValue(createdProduct),
        },
        inventoryLog: {
          create: vi.fn().mockResolvedValue({ id: 'log_1' }),
        },
      };
      return callback(txMock);
    });

    const req = new Request('http://localhost:3001/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Earthen Mug',
        price: 1100,
        category: 'ceramic',
        subCategory: 'mugs',
        stockQuantity: 15,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.product.id).toBe('prod_99');
  });
});

