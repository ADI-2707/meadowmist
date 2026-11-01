import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: vi.fn(),
    },
    productVariant: {
      findUnique: vi.fn(),
    },
    restockNotification: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('Product Restock Alert API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockContext = {
    params: Promise.resolve({ id: 'prod_clay_vase' }),
  };

  it('returns 400 when email is missing or invalid', async () => {
    const req = new Request('http://localhost:3000/api/products/prod_clay_vase/restock-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email' }),
    });

    const res = await POST(req, mockContext);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Please enter a valid email address');
  });

  it('returns 404 when product does not exist', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/products/prod_clay_vase/restock-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'buyer@example.com' }),
    });

    const res = await POST(req, mockContext);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe('Product not found');
  });

  it('returns 400 when variantId does not match the product', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      id: 'prod_clay_vase',
      name: 'Clay Vase',
    } as any);

    vi.mocked(prisma.productVariant.findUnique).mockResolvedValue({
      id: 'var_wrong',
      productId: 'another_product',
      name: 'Large',
    } as any);

    const req = new Request('http://localhost:3000/api/products/prod_clay_vase/restock-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'buyer@example.com', variantId: 'var_wrong' }),
    });

    const res = await POST(req, mockContext);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Selected variant not found for this product');
  });

  it('returns alreadyRegistered message if email already subscribed', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      id: 'prod_clay_vase',
      name: 'Clay Vase',
    } as any);

    vi.mocked(prisma.restockNotification.findFirst).mockResolvedValue({
      id: 'notif_1',
      productId: 'prod_clay_vase',
      email: 'buyer@example.com',
      notified: false,
    } as any);

    const req = new Request('http://localhost:3000/api/products/prod_clay_vase/restock-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'buyer@example.com' }),
    });

    const res = await POST(req, mockContext);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.alreadyRegistered).toBe(true);
    expect(body.message).toContain('already on the notification list');
  });

  it('creates restock notification record and returns 201 on success', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      id: 'prod_clay_vase',
      name: 'Clay Vase',
    } as any);

    vi.mocked(prisma.restockNotification.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.restockNotification.create).mockResolvedValue({
      id: 'notif_new',
      productId: 'prod_clay_vase',
      variantId: null,
      email: 'collector@example.com',
      notified: false,
      createdAt: new Date(),
    } as any);

    const req = new Request('http://localhost:3000/api/products/prod_clay_vase/restock-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'collector@example.com' }),
    });

    const res = await POST(req, mockContext);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.notification.id).toBe('notif_new');
    expect(prisma.restockNotification.create).toHaveBeenCalledWith({
      data: {
        productId: 'prod_clay_vase',
        variantId: null,
        email: 'collector@example.com',
      },
    });
  });
});

