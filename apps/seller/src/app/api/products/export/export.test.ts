import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { getAdminSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/session', () => ({
  getAdminSessionUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
  },
}));

describe('Catalog CSV Export API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when admin is unauthenticated', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns CSV stream with RFC 4180 headers and escaped product content', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Master Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.product.findMany).mockResolvedValue([
      {
        id: 'prod_1',
        name: 'Ceramic Mug, Speckled "Sun"',
        slug: 'ceramic-mug-speckled-sun',
        category: 'ceramic',
        subCategory: 'mugs',
        price: 1200,
        salePrice: null,
        stockQuantity: 15,
        lowStockThreshold: 3,
        inStock: true,
        colorFamily: 'ochre',
        scentFamily: null,
        badge: 'bestseller',
        isActive: true,
      } as any,
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/csv');
    expect(res.headers.get('Content-Disposition')).toContain('attachment; filename="meadow-mist-catalog-export.csv"');

    const csvText = await res.text();
    expect(csvText).toContain('id,name,slug,category,subCategory,price,salePrice,stockQuantity,lowStockThreshold,inStock,colorFamily,scentFamily,badge,isActive');
    expect(csvText).toContain('"Ceramic Mug, Speckled ""Sun"""');
  });

  it('returns 500 when database throws an exception', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Master Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.product.findMany).mockRejectedValue(new Error('DB failure'));

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to export catalog');
  });
});

