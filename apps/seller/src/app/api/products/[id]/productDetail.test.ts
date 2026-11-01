import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from './route';
import { getAdminSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/session', () => ({
  getAdminSessionUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    productVariant: {
      deleteMany: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
    },
    orderItem: {
      count: vi.fn(),
    },
  },
}));

describe('Seller Product Detail & Variants API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockContext = {
    params: Promise.resolve({ id: 'prod_101' }),
  };

  it('GET returns 404 when product is not found', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

    const req = new Request('http://localhost:3001/api/products/prod_101');
    const res = await GET(req, mockContext);

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Product not found');
  });

  it('GET returns product with variants when found', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      id: 'prod_101',
      name: 'Forest Moss Candle',
      slug: 'forest-moss-candle',
      variants: [
        { id: 'var_1', sku: 'FMC-200G', name: '200g Jar', price: 950, stockQuantity: 12 },
      ],
    } as any);

    const req = new Request('http://localhost:3001/api/products/prod_101');
    const res = await GET(req, mockContext);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.product.name).toBe('Forest Moss Candle');
    expect(body.product.variants).toHaveLength(1);
  });

  it('PUT returns 401 when admin is unauthenticated', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue(null);

    const req = new Request('http://localhost:3001/api/products/prod_101', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Candle' }),
    });

    const res = await PUT(req, mockContext);
    expect(res.status).toBe(401);
  });

  it('PUT updates product fields and variants', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      id: 'prod_101',
      name: 'Forest Moss Candle',
      price: 850,
      stockQuantity: 10,
    } as any);

    vi.mocked(prisma.product.update).mockResolvedValue({
      id: 'prod_101',
      name: 'Forest Moss & Sage Candle',
      price: 950,
      stockQuantity: 20,
      variants: [
        { id: 'var_1', sku: 'FMS-250', name: '250g Jar', price: 950, stockQuantity: 20 },
      ],
    } as any);

    const req = new Request('http://localhost:3001/api/products/prod_101', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Forest Moss & Sage Candle',
        price: 950,
        stockQuantity: 20,
        deletedVariantIds: ['old_var_99'],
        variants: [
          {
            id: 'var_1',
            sku: 'FMS-250',
            name: '250g Jar',
            price: 950,
            stockQuantity: 20,
            optionValues: { size: '250g' },
          },
        ],
      }),
    });

    const res = await PUT(req, mockContext);
    expect(res.status).toBe(200);
    expect(prisma.productVariant.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ['old_var_99'] }, productId: 'prod_101' },
    });
    expect(prisma.productVariant.upsert).toHaveBeenCalled();
  });

  it('DELETE archives product when order history exists', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.orderItem.count).mockResolvedValue(3);

    const req = new Request('http://localhost:3001/api/products/prod_101', {
      method: 'DELETE',
    });

    const res = await DELETE(req, mockContext);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.archived).toBe(true);
    expect(prisma.product.update).toHaveBeenCalledWith({
      where: { id: 'prod_101' },
      data: { isActive: false },
    });
  });

  it('DELETE removes product completely when no orders exist', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.orderItem.count).mockResolvedValue(0);

    const req = new Request('http://localhost:3001/api/products/prod_101', {
      method: 'DELETE',
    });

    const res = await DELETE(req, mockContext);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleted).toBe(true);
    expect(prisma.product.delete).toHaveBeenCalledWith({
      where: { id: 'prod_101' },
    });
  });
});

