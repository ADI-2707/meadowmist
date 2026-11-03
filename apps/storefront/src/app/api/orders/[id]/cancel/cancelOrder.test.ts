import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { getSessionUser, getAdminSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/session', () => ({
  getSessionUser: vi.fn(),
  getAdminSessionUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    productVariant: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    inventoryLog: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

describe('Order Cancellation API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockContext = {
    params: Promise.resolve({ id: 'order_123' }),
  };

  it('returns 401 when not authenticated', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    vi.mocked(getAdminSessionUser).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/orders/order_123/cancel', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Changed mind' }),
    });

    const res = await POST(req, mockContext);
    expect(res.status).toBe(401);
  });

  it('returns 404 when order does not exist', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'user_1',
      email: 'user@example.com',
      name: 'User One',
      role: 'CUSTOMER',
    });
    vi.mocked(getAdminSessionUser).mockResolvedValue(null);
    vi.mocked(prisma.order.findUnique).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/orders/order_123/cancel', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Changed mind' }),
    });

    const res = await POST(req, mockContext);
    expect(res.status).toBe(404);
  });

  it('returns 403 when user does not own the order', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'user_1',
      email: 'user@example.com',
      name: 'User One',
      role: 'CUSTOMER',
    });
    vi.mocked(getAdminSessionUser).mockResolvedValue(null);
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'order_123',
      userId: 'user_other',
      status: 'PENDING',
      trackingNumber: null,
      items: [],
    } as any);

    const req = new Request('http://localhost:3000/api/orders/order_123/cancel', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Changed mind' }),
    });

    const res = await POST(req, mockContext);
    expect(res.status).toBe(403);
  });

  it('returns 400 when order already has tracking number (shipping confirmed)', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'user_1',
      email: 'user@example.com',
      name: 'User One',
      role: 'CUSTOMER',
    });
    vi.mocked(getAdminSessionUser).mockResolvedValue(null);
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'order_123',
      userId: 'user_1',
      status: 'PROCESSING',
      trackingNumber: 'DEL123456789',
      items: [],
    } as any);

    const req = new Request('http://localhost:3000/api/orders/order_123/cancel', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Changed mind' }),
    });

    const res = await POST(req, mockContext);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('shipping has been confirmed');
  });

  it('returns 400 when order status is SHIPPED or DELIVERED', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'user_1',
      email: 'user@example.com',
      name: 'User One',
      role: 'CUSTOMER',
    });
    vi.mocked(getAdminSessionUser).mockResolvedValue(null);
    vi.mocked(prisma.order.findUnique).mockResolvedValue({
      id: 'order_123',
      userId: 'user_1',
      status: 'SHIPPED',
      trackingNumber: null,
      items: [],
    } as any);

    const req = new Request('http://localhost:3000/api/orders/order_123/cancel', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Changed mind' }),
    });

    const res = await POST(req, mockContext);
    expect(res.status).toBe(400);
  });

  it('successfully cancels pending order and restores stock', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'user_1',
      email: 'user@example.com',
      name: 'User One',
      role: 'CUSTOMER',
    });
    vi.mocked(getAdminSessionUser).mockResolvedValue(null);

    const mockOrder = {
      id: 'order_123',
      orderNumber: 'MM-ORD-1001',
      userId: 'user_1',
      status: 'PENDING',
      trackingNumber: null,
      items: [
        { productId: 'prod_1', quantity: 2 },
      ],
    };

    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const tx = {
        product: {
          findUnique: vi.fn().mockResolvedValue({ id: 'prod_1', stockQuantity: 5 }),
          update: vi.fn().mockResolvedValue({ id: 'prod_1', stockQuantity: 7 }),
        },
        productVariant: {
          findUnique: vi.fn(),
          update: vi.fn(),
        },
        inventoryLog: {
          create: vi.fn().mockResolvedValue({ id: 'log_1' }),
        },
        order: {
          update: vi.fn().mockResolvedValue({
            id: 'order_123',
            status: 'CANCELLED',
            cancellationReason: 'Ordered duplicate item',
          }),
        },
      };
      return callback(tx);
    });

    const req = new Request('http://localhost:3000/api/orders/order_123/cancel', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Ordered duplicate item' }),
    });

    const res = await POST(req, mockContext);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.order.status).toBe('CANCELLED');
    expect(data.order.cancellationReason).toBe('Ordered duplicate item');
  });

  it('restores both product and variant stock when item has variantId', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'user_1',
      email: 'user@example.com',
      name: 'User One',
      role: 'CUSTOMER',
    });
    vi.mocked(getAdminSessionUser).mockResolvedValue(null);

    const mockOrder = {
      id: 'order_123',
      orderNumber: 'MM-ORD-1002',
      userId: 'user_1',
      status: 'PENDING',
      trackingNumber: null,
      items: [
        { productId: 'prod_1', variantId: 'var_1', quantity: 3 },
      ],
    };

    vi.mocked(prisma.order.findUnique).mockResolvedValue(mockOrder as any);

    const updateProductMock = vi.fn().mockResolvedValue({ id: 'prod_1', stockQuantity: 13 });
    const updateVariantMock = vi.fn().mockResolvedValue({ id: 'var_1', stockQuantity: 8 });
    const createInventoryLogMock = vi.fn().mockResolvedValue({ id: 'log_1' });

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const tx = {
        product: {
          findUnique: vi.fn().mockResolvedValue({ id: 'prod_1', stockQuantity: 10 }),
          update: updateProductMock,
        },
        productVariant: {
          findUnique: vi.fn().mockResolvedValue({ id: 'var_1', productId: 'prod_1', sku: 'VAR-001', stockQuantity: 5 }),
          update: updateVariantMock,
        },
        inventoryLog: {
          create: createInventoryLogMock,
        },
        order: {
          update: vi.fn().mockResolvedValue({
            id: 'order_123',
            status: 'CANCELLED',
            cancellationReason: 'Variant canceled',
          }),
        },
      };
      return callback(tx);
    });

    const req = new Request('http://localhost:3000/api/orders/order_123/cancel', {
      method: 'POST',
      body: JSON.stringify({ reason: 'Variant canceled' }),
    });

    const res = await POST(req, mockContext);
    expect(res.status).toBe(200);
    expect(updateProductMock).toHaveBeenCalledWith({
      where: { id: 'prod_1' },
      data: { stockQuantity: 13, inStock: true },
    });
    expect(updateVariantMock).toHaveBeenCalledWith({
      where: { id: 'var_1' },
      data: { stockQuantity: 8, inStock: true },
    });
    expect(createInventoryLogMock).toHaveBeenCalledTimes(2);
  });
});
