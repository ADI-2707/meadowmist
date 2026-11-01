import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { getAdminSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/session', () => ({
  getAdminSessionUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    inventoryLog: {
      findMany: vi.fn(),
    },
  },
}));

describe('Seller Inventory Movement Logs API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when admin is unauthenticated', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 50 most recent inventory logs with product metadata', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.inventoryLog.findMany).mockResolvedValue([
      {
        id: 'log_1',
        productId: 'prod_1',
        changeQuantity: 10,
        newQuantity: 20,
        reason: 'RESTOCK',
        note: 'Kiln firing completion',
        createdAt: new Date().toISOString(),
        product: { id: 'prod_1', name: 'Ceramic Planter', category: 'ceramic' },
      } as any,
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.logs).toHaveLength(1);
    expect(body.logs[0].reason).toBe('RESTOCK');
    expect(body.logs[0].product.name).toBe('Ceramic Planter');
  });

  it('returns 500 when database fails', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.inventoryLog.findMany).mockRejectedValue(new Error('DB failure'));

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch inventory logs');
  });
});
