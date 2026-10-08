import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/session', () => ({
  getSessionUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: vi.fn(),
  },
}));

describe('Place Order API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validAddress = {
    fullName: 'Ananya Sharma',
    streetAddress: 'Flat 402, Green Meadows',
    city: 'Bengaluru',
    postalCode: '560001',
  };

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/orders/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [{ productId: 'p1', qty: 1 }] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Please sign in to place your order');
  });

  it('returns 400 when items array is missing or empty', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'user_1',
      email: 'ananya@example.com',
      name: 'Ananya',
      role: 'CUSTOMER',
    });

    const req = new Request('http://localhost:3000/api/orders/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: [] }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Order must contain at least one item');
  });

  it('returns 400 when delivery address is incomplete', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'user_1',
      email: 'ananya@example.com',
      name: 'Ananya',
      role: 'CUSTOMER',
    });

    const req = new Request('http://localhost:3000/api/orders/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'p1', qty: 1 }],
        shippingAddress: { city: 'Bengaluru' },
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Valid delivery address is required');
  });

  it('returns 400 when atomic stock decrement fails due to insufficient stock', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'user_1',
      email: 'ananya@example.com',
      name: 'Ananya',
      role: 'CUSTOMER',
    });

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const mockTx = {
        product: {
          findUnique: vi.fn().mockResolvedValue({
            id: 'p1',
            name: 'Amber Candle',
            price: 899,
            isActive: true,
            stockQuantity: 2,
            images: '["/amber.jpg"]',
          }),
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      };
      return callback(mockTx as any);
    });

    const req = new Request('http://localhost:3000/api/orders/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'p1', qty: 3 }],
        shippingAddress: validAddress,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Insufficient stock for "Amber Candle"');
  });

  it('places order successfully and returns 201 when atomic stock update succeeds', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'user_1',
      email: 'ananya@example.com',
      name: 'Ananya',
      role: 'CUSTOMER',
    });

    const mockCreatedOrder = {
      id: 'order_123',
      orderNumber: 'MM-2026-9999',
      subtotal: 899,
      totalAmount: 998,
      status: 'PENDING',
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const mockTx = {
        product: {
          findUnique: vi.fn()
            .mockResolvedValueOnce({
              id: 'p1',
              name: 'Amber Candle',
              price: 899,
              isActive: true,
              stockQuantity: 10,
              images: '["/amber.jpg"]',
            })
            .mockResolvedValueOnce({
              stockQuantity: 9,
            }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          update: vi.fn(),
        },
        inventoryLog: {
          create: vi.fn().mockResolvedValue({ id: 'log_1' }),
        },
        order: {
          create: vi.fn().mockResolvedValue(mockCreatedOrder),
        },
        cartItem: {
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };
      return callback(mockTx as any);
    });

    const req = new Request('http://localhost:3000/api/orders/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'p1', qty: 1 }],
        shippingAddress: validAddress,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.order).toEqual(mockCreatedOrder);
  });

  it('applies free shipping when subtotal reaches free shipping threshold', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'user_1',
      email: 'ananya@example.com',
      name: 'Ananya',
      role: 'CUSTOMER',
    });

    let capturedCreateData: any = null;

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const mockTx = {
        product: {
          findUnique: vi.fn()
            .mockResolvedValueOnce({
              id: 'p1',
              name: 'Ceramic Vase',
              price: 1600,
              isActive: true,
              stockQuantity: 5,
              images: '["/vase.jpg"]',
            })
            .mockResolvedValueOnce({
              stockQuantity: 4,
            }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          update: vi.fn(),
        },
        inventoryLog: {
          create: vi.fn().mockResolvedValue({ id: 'log_1' }),
        },
        storeSettings: {
          findUnique: vi.fn().mockResolvedValue({
            shippingFlatRate: 120,
            freeShippingThreshold: 1500,
          }),
        },
        order: {
          create: vi.fn().mockImplementation(async (args) => {
            capturedCreateData = args.data;
            return { id: 'order_free_ship', ...args.data };
          }),
        },
        cartItem: {
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };
      return callback(mockTx as any);
    });

    const req = new Request('http://localhost:3000/api/orders/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'p1', qty: 1 }],
        shippingAddress: validAddress,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(capturedCreateData.shippingCharges).toBe(0);
    expect(capturedCreateData.totalAmount).toBe(1600);
  });

  it('charges custom store settings flat rate shipping when below threshold', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'user_1',
      email: 'ananya@example.com',
      name: 'Ananya',
      role: 'CUSTOMER',
    });

    let capturedCreateData: any = null;

    vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
      const mockTx = {
        product: {
          findUnique: vi.fn()
            .mockResolvedValueOnce({
              id: 'p1',
              name: 'Small Candle',
              price: 500,
              isActive: true,
              stockQuantity: 5,
              images: '["/candle.jpg"]',
            })
            .mockResolvedValueOnce({
              stockQuantity: 4,
            }),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
          update: vi.fn(),
        },
        inventoryLog: {
          create: vi.fn().mockResolvedValue({ id: 'log_1' }),
        },
        storeSettings: {
          findUnique: vi.fn().mockResolvedValue({
            shippingFlatRate: 150,
            freeShippingThreshold: 1000,
          }),
        },
        order: {
          create: vi.fn().mockImplementation(async (args) => {
            capturedCreateData = args.data;
            return { id: 'order_flat_ship', ...args.data };
          }),
        },
        cartItem: {
          deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      };
      return callback(mockTx as any);
    });

    const req = new Request('http://localhost:3000/api/orders/place', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [{ productId: 'p1', qty: 1 }],
        shippingAddress: validAddress,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(capturedCreateData.shippingCharges).toBe(150);
    expect(capturedCreateData.totalAmount).toBe(650);
  });
});
