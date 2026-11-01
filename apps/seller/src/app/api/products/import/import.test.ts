import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { getAdminSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/session', () => ({
  getAdminSessionUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Catalog CSV Import API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when admin is not authenticated', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue(null);

    const req = new Request('http://localhost:3001/api/products/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvContent: 'name,slug,price\nItem,item,100' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 400 when CSV is empty', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'admin@meadowmist.in',
      name: 'Admin',
      role: 'ADMIN',
    });

    const req = new Request('http://localhost:3001/api/products/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvContent: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Empty or missing CSV content');
  });

  it('successfully creates new products and updates existing ones from CSV', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'admin@meadowmist.in',
      name: 'Admin',
      role: 'ADMIN',
    });

    vi.mocked(prisma.product.findUnique)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'existing_prod_1',
        slug: 'terracotta-pitcher',
        subCategory: 'pitchers',
        colorFamily: 'clay',
        scentFamily: null,
        badge: null,
      } as any);

    vi.mocked(prisma.product.create).mockResolvedValue({ id: 'new_prod_1' } as any);
    vi.mocked(prisma.product.update).mockResolvedValue({ id: 'existing_prod_1' } as any);

    const csvData = [
      'name,slug,category,price,stockQuantity',
      'Wild Honey Candle,wild-honey-candle,candle,850,12',
      'Terracotta Pitcher,terracotta-pitcher,ceramic,1400,8',
    ].join('\n');

    const req = new Request('http://localhost:3001/api/products/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ csvContent: csvData }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.createdCount).toBe(1);
    expect(body.updatedCount).toBe(1);
    expect(prisma.product.create).toHaveBeenCalled();
    expect(prisma.product.update).toHaveBeenCalled();
  });
});

