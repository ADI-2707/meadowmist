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
      count: vi.fn(),
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

  it('returns inventory logs with product metadata and pagination', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.inventoryLog.count).mockResolvedValue(1);
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
    expect(body.pagination).toBeDefined();
  });

  it('supports explicit page and limit pagination params', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.inventoryLog.count).mockResolvedValue(45);
    vi.mocked(prisma.inventoryLog.findMany).mockResolvedValue([
      {
        id: 'log_2',
        productId: 'prod_1',
        changeQuantity: 5,
        newQuantity: 25,
        reason: 'RESTOCK',
        note: 'Second batch',
        createdAt: new Date().toISOString(),
        product: { id: 'prod_1', name: 'Ceramic Planter', category: 'ceramic' },
      } as any,
    ]);

    const req = new Request('http://localhost:3001/api/inventory/logs?page=2&limit=20');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.pagination.page).toBe(2);
    expect(body.pagination.limit).toBe(20);
    expect(body.pagination.total).toBe(45);
    expect(body.pagination.totalPages).toBe(3);
    expect(body.pagination.hasNext).toBe(true);
    expect(body.pagination.hasPrev).toBe(true);
  });

  it('returns 500 when database fails', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.inventoryLog.count).mockRejectedValue(new Error('DB failure'));

    const res = await GET();
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe('Failed to fetch inventory logs');
  });
});
