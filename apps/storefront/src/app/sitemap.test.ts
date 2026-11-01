import { describe, it, expect, vi, beforeEach } from 'vitest';
import sitemap from './sitemap';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
    },
    journalArticle: {
      findMany: vi.fn(),
    },
  },
}));

describe('Storefront Sitemap Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates static routes and dynamic product and journal URLs', async () => {
    const updatedAt = new Date('2026-10-30T10:00:00Z');

    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { slug: 'forest-amber-candle', updatedAt },
    ] as any);

    vi.mocked(prisma.journalArticle.findMany).mockResolvedValue([
      { slug: 'art-of-slow-burning-wicks', updatedAt },
    ] as any);

    const entries = await sitemap();

    expect(entries.some((e) => e.url === 'https://meadowmist.in/')).toBe(true);
    expect(entries.some((e) => e.url === 'https://meadowmist.in/candles')).toBe(true);
    expect(entries.some((e) => e.url === 'https://meadowmist.in/ceramics')).toBe(true);
    expect(entries.some((e) => e.url === 'https://meadowmist.in/product/forest-amber-candle')).toBe(true);
    expect(entries.some((e) => e.url === 'https://meadowmist.in/journal/art-of-slow-burning-wicks')).toBe(true);
  });

  it('gracefully handles database failure and still returns static routes', async () => {
    vi.mocked(prisma.product.findMany).mockRejectedValue(new Error('DB failure'));
    vi.mocked(prisma.journalArticle.findMany).mockRejectedValue(new Error('DB failure'));

    const entries = await sitemap();

    expect(entries.length).toBeGreaterThan(0);
    expect(entries.some((e) => e.url === 'https://meadowmist.in/')).toBe(true);
  });
});
