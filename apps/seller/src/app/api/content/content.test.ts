import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getFaqs, POST as postFaq, DELETE as deleteFaq } from './faqs/route';
import { GET as getBanners, POST as postBanner, DELETE as deleteBanner } from './banners/route';
import { GET as getPromotions, POST as postPromotion, DELETE as deletePromotion } from './promotions/route';
import { getAdminSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/session', () => ({
  getAdminSessionUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    fAQ: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    banner: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    promotion: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('Seller Marketing Content Management APIs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/content/faqs returns sorted list of studio FAQs', async () => {
    vi.mocked(prisma.fAQ.findMany).mockResolvedValue([
      { id: 'faq_1', question: 'Are candles 100% soy?', answer: 'Yes, poured with natural soy wax.' } as any,
    ]);

    const res = await getFaqs();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.faqs).toHaveLength(1);
    expect(body.faqs[0].question).toContain('soy');
  });

  it('POST /api/content/faqs creates FAQ when admin authorized', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.fAQ.create).mockResolvedValue({
      id: 'faq_2',
      question: 'How to clean ceramic vessels?',
      answer: 'Hand wash with mild warm water.',
      category: 'Care',
    } as any);

    const req = new Request('http://localhost:3001/api/content/faqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'How to clean ceramic vessels?',
        answer: 'Hand wash with mild warm water.',
        category: 'Care',
      }),
    });

    const res = await postFaq(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.faq.id).toBe('faq_2');
  });

  it('POST /api/content/banners creates homepage showcase banner', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.banner.create).mockResolvedValue({
      id: 'ban_1',
      title: 'Autumn Harvest Collection',
      imageUrl: '/images/hero-autumn.jpg',
    } as any);

    const req = new Request('http://localhost:3001/api/content/banners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Autumn Harvest Collection',
        imageUrl: '/images/hero-autumn.jpg',
        badgeText: 'New Kiln Batch',
      }),
    });

    const res = await postBanner(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.banner.title).toBe('Autumn Harvest Collection');
  });

  it('POST /api/content/promotions creates uppercase coupon code', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    vi.mocked(prisma.promotion.create).mockResolvedValue({
      id: 'promo_1',
      code: 'DIWALI20',
      discountType: 'PERCENTAGE',
      discountValue: 20,
    } as any);

    const req = new Request('http://localhost:3001/api/content/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'diwali20',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minOrderValue: 1500,
      }),
    });

    const res = await postPromotion(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.promo.code).toBe('DIWALI20');
  });

  it('DELETE /api/content/promotions deletes promo by query id', async () => {
    vi.mocked(getAdminSessionUser).mockResolvedValue({
      userId: 'admin_1',
      email: 'artisan@meadowmist.in',
      name: 'Artisan',
      role: 'ADMIN',
    });

    const req = new Request('http://localhost:3001/api/content/promotions?id=promo_1', {
      method: 'DELETE',
    });

    const res = await deletePromotion(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(prisma.promotion.delete).toHaveBeenCalledWith({ where: { id: 'promo_1' } });
  });
});

