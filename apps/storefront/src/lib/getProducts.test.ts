import { describe, it, expect, vi, beforeEach } from 'vitest';
import { prisma } from '@/lib/prisma';
import {
  getProducts,
  getProductBySlug,
  getRelatedProducts,
  getAllSlugs,
  getFeaturedProducts,
} from './getProducts';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    product: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

describe('Storefront getProducts Database-Driven Service', () => {
  const sampleDbProduct = {
    id: 'prod-001',
    slug: 'lotus-bowl-blush',
    name: 'Blush Lotus Bowl',
    description: 'Handcrafted blush lotus ceramic bowl',
    price: 849,
    salePrice: null,
    category: 'ceramic',
    subCategory: 'bowl',
    images: JSON.stringify(['/images/lotus.jpg']),
    materials: JSON.stringify(['Ceramic', 'Mineral Glaze']),
    dimensions: '14 cm x 6 cm',
    badge: 'bestseller',
    colorFamily: 'blush',
    scentFamily: null,
    scentNotes: null,
    customOptions: JSON.stringify({ finishes: ['Matte'] }),
    stockQuantity: 12,
    lowStockThreshold: 5,
    inStock: true,
    isFeatured: true,
    isActive: true,
    reviews: [{ rating: 5 }],
  };

  const reviewInclude = {
    reviews: {
      where: { isApproved: true },
      select: { rating: true },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches products directly from the database and formats them', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([sampleDbProduct] as any);

    const result = await getProducts();
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      include: reviewInclude,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Blush Lotus Bowl');
    expect(result[0].stockQuantity).toBe(12);
    expect(result[0].inStock).toBe(true);
    expect(result[0].averageRating).toBe(5);
  });

  it('filters by category when specified', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([sampleDbProduct] as any);

    await getProducts('ceramic');
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { isActive: true, category: 'ceramic' },
      include: reviewInclude,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });
  });

  it('returns an empty array when no products are found in the database', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([]);

    const result = await getProducts();
    expect(result).toEqual([]);
  });

  it('returns null when product by slug is not found', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(null);

    const result = await getProductBySlug('non-existent-slug');
    expect(result).toBeNull();
  });

  it('returns formatted product when product by slug exists', async () => {
    vi.mocked(prisma.product.findUnique).mockResolvedValue(sampleDbProduct as any);

    const result = await getProductBySlug('lotus-bowl-blush');
    expect(result).not.toBeNull();
    expect(result?.slug).toBe('lotus-bowl-blush');
    expect(result?.stockQuantity).toBe(12);
    expect(result?.averageRating).toBe(5);
  });

  it('fetches related products excluding current slug', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([sampleDbProduct] as any);

    const result = await getRelatedProducts('other-slug', 'ceramic', 3);
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: {
        category: 'ceramic',
        slug: { not: 'other-slug' },
        isActive: true,
      },
      include: reviewInclude,
      take: 3,
      orderBy: { isFeatured: 'desc' },
    });
    expect(result).toHaveLength(1);
  });

  it('fetches all active slugs', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([
      { slug: 'lotus-bowl-blush' },
      { slug: 'daisy-trinket-box' },
    ] as any);

    const slugs = await getAllSlugs();
    expect(slugs).toEqual(['lotus-bowl-blush', 'daisy-trinket-box']);
  });

  it('fetches featured products with limit and ordering', async () => {
    vi.mocked(prisma.product.findMany).mockResolvedValue([sampleDbProduct] as any);

    const featured = await getFeaturedProducts(3, 'ceramic');
    expect(prisma.product.findMany).toHaveBeenCalledWith({
      where: { isActive: true, category: 'ceramic' },
      include: reviewInclude,
      take: 3,
      orderBy: [{ isFeatured: 'desc' }, { badge: 'desc' }],
    });
    expect(featured).toHaveLength(1);
  });

  it('formats product with 0 reviews as 0 average rating and 0 review count', async () => {
    const unreviewedProduct = {
      ...sampleDbProduct,
      reviews: [],
    };
    vi.mocked(prisma.product.findMany).mockResolvedValue([unreviewedProduct] as any);

    const result = await getProducts();
    expect(result[0].reviewCount).toBe(0);
    expect(result[0].averageRating).toBe(0);
  });
});
