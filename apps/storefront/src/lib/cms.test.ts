import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getHeroSlides, getStoreSettings, getFaqs, getTopReviews } from './cms';
import { prisma } from '@/lib/prisma';
import { HERO_SLIDES } from '@/data/heroData';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    banner: {
      findMany: vi.fn(),
    },
    storeSettings: {
      findUnique: vi.fn(),
    },
    fAQ: {
      findMany: vi.fn(),
    },
    review: {
      findMany: vi.fn(),
    },
  },
}));

describe('CMS Library Utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHeroSlides', () => {
    it('returns formatted slides when active banners exist', async () => {
      vi.mocked(prisma.banner.findMany).mockResolvedValue([
        {
          id: 'banner-1',
          title: 'Monsoon Awakening',
          subtitle: 'Pure botanical essence',
          imageUrl: '/images/hero-1.webp',
          linkUrl: '/collection/monsoon',
          badgeText: 'New Release',
          sortOrder: 1,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const slides = await getHeroSlides();
      expect(slides).toHaveLength(1);
      expect(slides[0].id).toBe('banner-1');
      expect(slides[0].headlinePre).toBe('Monsoon Awakening');
      expect(slides[0].badge).toBe('New Release');
      expect(slides[0].primaryCta.href).toBe('/collection/monsoon');
    });

    it('returns default HERO_SLIDES when no banners exist in database', async () => {
      vi.mocked(prisma.banner.findMany).mockResolvedValue([]);

      const slides = await getHeroSlides();
      expect(slides).toEqual(HERO_SLIDES);
    });

    it('returns default HERO_SLIDES when query throws an error', async () => {
      vi.mocked(prisma.banner.findMany).mockRejectedValue(new Error('Connection lost'));

      const slides = await getHeroSlides();
      expect(slides).toEqual(HERO_SLIDES);
    });
  });

  describe('getStoreSettings', () => {
    it('returns store settings record when found', async () => {
      const mockSettings = {
        id: 'default',
        storeName: 'Meadow Mist',
        shippingFlatRate: 99,
      };
      vi.mocked(prisma.storeSettings.findUnique).mockResolvedValue(mockSettings as any);

      const result = await getStoreSettings();
      expect(result).toEqual(mockSettings);
    });

    it('returns null on failure', async () => {
      vi.mocked(prisma.storeSettings.findUnique).mockRejectedValue(new Error('DB error'));

      const result = await getStoreSettings();
      expect(result).toBeNull();
    });
  });

  describe('getFaqs', () => {
    it('returns active FAQs sorted by sortOrder', async () => {
      const mockFaqs = [
        { id: 'faq-1', question: 'How long do candles burn?', answer: '45 hours', category: 'Candles', sortOrder: 1, isActive: true },
        { id: 'faq-2', question: 'Are ceramics food-safe?', answer: 'Yes', category: 'Ceramics', sortOrder: 2, isActive: true },
      ];
      vi.mocked(prisma.fAQ.findMany).mockResolvedValue(mockFaqs as any);

      const faqs = await getFaqs();
      expect(faqs).toHaveLength(2);
      expect(faqs[0].id).toBe('faq-1');
    });

    it('returns empty array on database error', async () => {
      vi.mocked(prisma.fAQ.findMany).mockRejectedValue(new Error('DB error'));

      const faqs = await getFaqs();
      expect(faqs).toEqual([]);
    });
  });

  describe('getTopReviews', () => {
    it('returns up to 6 approved 4+ star reviews with relations', async () => {
      const mockReviews = [
        {
          id: 'rev-1',
          rating: 5,
          comment: 'Heavenly aroma',
          isApproved: true,
          product: { name: 'Eucalyptus Candle', slug: 'eucalyptus', category: 'CANDLES' },
          user: { name: 'Ananya' },
        },
      ];
      vi.mocked(prisma.review.findMany).mockResolvedValue(mockReviews as any);

      const reviews = await getTopReviews();
      expect(reviews).toHaveLength(1);
      expect(reviews[0].product.name).toBe('Eucalyptus Candle');
      expect(prisma.review.findMany).toHaveBeenCalledWith({
        where: { isApproved: true, rating: { gte: 4 } },
        take: 6,
        orderBy: { createdAt: 'desc' },
        include: {
          product: { select: { name: true, slug: true, category: true } },
          user: { select: { name: true } },
        },
      });
    });

    it('returns empty array on error', async () => {
      vi.mocked(prisma.review.findMany).mockRejectedValue(new Error('DB error'));

      const reviews = await getTopReviews();
      expect(reviews).toEqual([]);
    });
  });
});
