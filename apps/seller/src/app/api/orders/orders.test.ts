import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getOrders } from './route';
import { GET as getOrderDetail, PATCH as patchOrder } from './[id]/route';
import { getAdminSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/session', () => ({
  getAdminSessionUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findMany: vi.fn(),
      count: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    inventoryLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('Seller Orders Management API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockContext = {
    params: Promise.resolve({ id: 'ord_101' }),
  };

  it('GET /api/orders returns 401 when admin is unauthenticated', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue(null);

    const req = new Request('http://localhost:3001/api/orders');
    const res = await getOrders(req);

    expect(res.status).toBe(401);
  });

  it('GET /api/orders returns paginated orders with customer details', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.order.findMany).mockResolvedValue([
      {
        id: 'ord_101',
        orderNumber: 'MM-ORD-2026-101',
        status: 'PROCESSING',
        totalAmount: 1850,
        user: { name: 'Priya Sharma', email: 'priya@example.com' },
      } as any,
    ]);
    vi.mocked(prisma.order.count).mockResolvedValue(1);

    const req = new Request('http://localhost:3001/api/orders?status=PROCESSING&page=1&limit=10');
    const res = await getOrders(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.orders).toHaveLength(1);
    expect(body.orders[0].orderNumber).toBe('MM-ORD-2026-101');
    expect(body.pagination.total).toBe(1);
  });

  it('GET /api/orders/[id] returns 404 when order does not exist', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.order.findFirst).mockResolvedValue(null);

    const req = new Request('http://localhost:3001/api/orders/ord_101');
    const res = await getOrderDetail(req, mockContext);

    expect(res.status).toBe(404);
  });

  it('GET /api/orders/[id] returns order details with items and variants', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.order.findFirst).mockResolvedValue({
      id: 'ord_101',
      orderNumber: 'MM-ORD-2026-101',
      items: [
        {
          id: 'item_1',
          productName: 'Botanical Amber Soy Candle',
          quantity: 2,
          unitPrice: 750,
        },
      ],
    } as any);

    const req = new Request('http://localhost:3001/api/orders/ord_101');
    const res = await getOrderDetail(req, mockContext);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.order.orderNumber).toBe('MM-ORD-2026-101');
    expect(body.order.items).toHaveLength(1);
  });

  it('PATCH /api/orders/[id] restores inventory when order is cancelled', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.order.findFirst).mockResolvedValue({
      id: 'ord_101',
      orderNumber: 'MM-ORD-2026-101',
      status: 'CONFIRMED',
      items: [{ productId: 'prod_1', quantity: 2 }],
    } as any);

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const txMock = {
        product: {
          findUnique: vi.fn().mockResolvedValue({ id: 'prod_1', stockQuantity: 5 }),
          update: vi.fn().mockResolvedValue({ id: 'prod_1', stockQuantity: 7 }),
        },
        inventoryLog: {
          create: vi.fn().mockResolvedValue({ id: 'log_cancel' }),
        },
      };
      return callback(txMock);
    });

    vi.mocked(prisma.order.update).mockResolvedValue({
      id: 'ord_101',
      status: 'CANCELLED',
    } as any);

    const req = new Request('http://localhost:3001/api/orders/ord_101', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });

    const res = await patchOrder(req, mockContext);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.order.status).toBe('CANCELLED');
    expect(prisma.$transaction).toHaveBeenCalled();
  });
});
