import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    promotion: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Storefront Coupon Code Verification Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when coupon code is missing', async () => {
    const req = new Request('http://localhost:3000/api/promotions/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 when code does not exist or is inactive', async () => {
    vi.mocked(prisma.promotion.findUnique).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/promotions/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'INVALIDCODE', orderAmount: 2000 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('returns 400 when order total is below minimum threshold', async () => {
    vi.mocked(prisma.promotion.findUnique).mockResolvedValue({
      code: 'FESTIVE15',
      isActive: true,
      minOrderValue: 2000,
      discountType: 'PERCENTAGE',
      discountValue: 15,
    } as any);

    const req = new Request('http://localhost:3000/api/promotions/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'FESTIVE15', orderAmount: 1200 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Minimum order amount');
  });

  it('calculates percentage discount capped by maxDiscount', async () => {
    vi.mocked(prisma.promotion.findUnique).mockResolvedValue({
      code: 'FESTIVE25',
      isActive: true,
      minOrderValue: 1000,
      discountType: 'PERCENTAGE',
      discountValue: 25,
      maxDiscount: 400,
      description: '25% off festive orders',
    } as any);

    const req = new Request('http://localhost:3000/api/promotions/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'festive25', orderAmount: 3000 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.discount).toBe(400);
    expect(body.code).toBe('FESTIVE25');
  });

  it('calculates fixed currency discount', async () => {
    vi.mocked(prisma.promotion.findUnique).mockResolvedValue({
      code: 'WELCOME200',
      isActive: true,
      minOrderValue: 1000,
      discountType: 'FIXED',
      discountValue: 200,
      description: '₹200 off your first craft order',
    } as any);

    const req = new Request('http://localhost:3000/api/promotions/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: 'WELCOME200', orderAmount: 1500 }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.discount).toBe(200);
  });
});

