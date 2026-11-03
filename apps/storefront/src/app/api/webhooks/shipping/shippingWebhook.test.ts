import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    order: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Shipping Webhook API', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.SHIPPING_WEBHOOK_SECRET;
  });

  it('rejects with 401 when secret is configured and header is missing', async () => {
    process.env.SHIPPING_WEBHOOK_SECRET = 'secret_test_123';

    const req = new Request('http://localhost:3000/api/webhooks/shipping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingNumber: 'TRK123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Unauthorized webhook call');
  });

  it('rejects with 401 when secret is configured and header is incorrect', async () => {
    process.env.SHIPPING_WEBHOOK_SECRET = 'secret_test_123';

    const req = new Request('http://localhost:3000/api/webhooks/shipping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': 'wrong_secret',
      },
      body: JSON.stringify({ trackingNumber: 'TRK123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('authenticates successfully with x-webhook-secret header and updates delivery status', async () => {
    process.env.SHIPPING_WEBHOOK_SECRET = 'secret_test_123';

    vi.mocked(prisma.order.findFirst).mockResolvedValue({
      id: 'ord_1',
      trackingNumber: 'TRK123',
      status: 'SHIPPED',
    } as any);

    vi.mocked(prisma.order.update).mockResolvedValue({
      id: 'ord_1',
      status: 'DELIVERED',
      courierStatus: 'Delivered to resident',
    } as any);

    const req = new Request('http://localhost:3000/api/webhooks/shipping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': 'secret_test_123',
      },
      body: JSON.stringify({
        trackingNumber: 'TRK123',
        courierStatus: 'Delivered to resident',
        delivered: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe('DELIVERED');
  });

  it('authenticates successfully with Authorization Bearer header', async () => {
    process.env.SHIPPING_WEBHOOK_SECRET = 'secret_test_123';

    vi.mocked(prisma.order.findFirst).mockResolvedValue({
      id: 'ord_1',
      trackingNumber: 'TRK123',
      status: 'SHIPPED',
    } as any);

    vi.mocked(prisma.order.update).mockResolvedValue({
      id: 'ord_1',
      status: 'DELIVERED',
      courierStatus: 'Delivered',
    } as any);

    const req = new Request('http://localhost:3000/api/webhooks/shipping', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer secret_test_123',
      },
      body: JSON.stringify({
        trackingNumber: 'TRK123',
        delivered: true,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it('returns 400 when trackingNumber is missing', async () => {
    const req = new Request('http://localhost:3000/api/webhooks/shipping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courierStatus: 'In Transit' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 when order is not found', async () => {
    vi.mocked(prisma.order.findFirst).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/webhooks/shipping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackingNumber: 'NON_EXISTENT' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });
});

