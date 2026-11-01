import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT } from './route';
import { getAdminSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/session', () => ({
  getAdminSessionUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('Storefront Product Detail by ID Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockContext = {
    params: Promise.resolve({ id: 'prod_amber' }),
  };

  it('GET returns 404 when product is not found', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/products/prod_amber');
    const res = await GET(req, mockContext);

    expect(res.status).toBe(404);
  });

  it('GET returns product with variants', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue({
      id: 'prod_amber',
      name: 'Amber Soy Candle',
      slug: 'amber-soy-candle',
      variants: [{ id: 'var_1', sku: 'AMB-100', name: '100g' }],
    } as any);

    const req = new Request('http://localhost:3000/api/products/prod_amber');
    const res = await GET(req, mockContext);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.product.name).toBe('Amber Soy Candle');
    expect(body.product.variants).toHaveLength(1);
  });

  it('PUT returns 401 when admin is unauthenticated', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/products/prod_amber', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    });

    const res = await PUT(req, mockContext);
    expect(res.status).toBe(401);
  });
});

