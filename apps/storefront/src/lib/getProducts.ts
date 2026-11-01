import { prisma } from '@/lib/prisma';
import type { Product, CustomOptions } from '@/types/product';

interface DbProductPayload {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  salePrice: number | null;
  category: string;
  subCategory: string;
  images: string;
  materials: string;
  dimensions: string | null;
  badge: string | null;
  colorFamily: string;
  scentFamily: string | null;
  scentNotes: string | null;
  customOptions: string | null;
  stockQuantity: number;
  lowStockThreshold: number;
  inStock: boolean;
  isFeatured: boolean;
  isActive: boolean;
  reviews?: Array<{ rating: number }>;
}

function formatDbProduct(p: DbProductPayload): Product {
  let images: string[] = [];
  try {
    images = JSON.parse(p.images);
  } catch {
    images = [p.images];
  }

  let materials: string[] = [];
  try {
    materials = JSON.parse(p.materials);
  } catch {
    materials = [p.materials];
  }

  let scentNotes: string[] = [];
  try {
    scentNotes = p.scentNotes ? JSON.parse(p.scentNotes) : [];
  } catch {
    scentNotes = [];
  }

  let customOptions: CustomOptions | null = null;
  try {
    customOptions = p.customOptions ? JSON.parse(p.customOptions) : null;
  } catch {
    customOptions = null;
  }

  const reviewList = p.reviews || [];
  const reviewCount = reviewList.length;
  const ratingSum = reviewList.reduce((acc, r) => acc + r.rating, 0);
  const averageRating = reviewCount > 0 ? Number((ratingSum / reviewCount).toFixed(1)) : 0;

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category as 'candle' | 'ceramic',
    subCategory: p.subCategory,
    price: p.price,
    salePrice: p.salePrice,
    images,
    scentFamily: (p.scentFamily as Product['scentFamily']) || null,
    materials,
    dimensions: p.dimensions,
    story: p.description,
    scentNotes,
    badge: (p.badge as Product['badge']) || null,
    colorFamily: p.colorFamily as Product['colorFamily'],
    inStock: p.inStock && p.stockQuantity > 0,
    stockQuantity: p.stockQuantity,
    lowStockThreshold: p.lowStockThreshold,
    isFeatured: p.isFeatured,
    isActive: p.isActive,
    customOptions,
    averageRating,
    reviewCount,
  };
}

export async function getProducts(category?: 'candle' | 'ceramic'): Promise<Product[]> {
  try {
    const whereClause: { isActive: boolean; category?: string } = { isActive: true };
    if (category) {
      whereClause.category = category;
    }

    const items = await prisma.product.findMany({
      where: whereClause,
      include: {
        reviews: {
          where: { isApproved: true },
          select: { rating: true },
        },
      },
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
    });

    return items.map(formatDbProduct);
  } catch (err) {
    console.error('Failed to query products from DB:', err);
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const item = await prisma.product.findUnique({
      where: { slug },
      include: {
        reviews: {
          where: { isApproved: true },
          select: { rating: true },
        },
      },
    });
    if (item && item.isActive) {
      return formatDbProduct(item);
    }
    return null;
  } catch (err) {
    console.error('Failed to query product by slug from DB:', err);
    return null;
  }
}

export async function getRelatedProducts(
  currentSlug: string,
  category: 'candle' | 'ceramic',
  limit = 3
): Promise<Product[]> {
  try {
    const items = await prisma.product.findMany({
      where: {
        category,
        slug: { not: currentSlug },
        isActive: true,
      },
      include: {
        reviews: {
          where: { isApproved: true },
          select: { rating: true },
        },
      },
      take: limit,
      orderBy: { isFeatured: 'desc' },
    });

    return items.map(formatDbProduct);
  } catch (err) {
    console.error('Failed to query related products from DB:', err);
    return [];
  }
}

export async function getAllSlugs(): Promise<string[]> {
  try {
    const items = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true },
    });
    return items.map((i: { slug: string }) => i.slug);
  } catch (err) {
    console.error('Failed to query slugs from DB:', err);
    return [];
  }
}

export async function getFeaturedProducts(
  limit = 3,
  category?: 'candle' | 'ceramic'
): Promise<Product[]> {
  try {
    const whereClause: { isActive: boolean; category?: string } = { isActive: true };
    if (category) whereClause.category = category;

    const items = await prisma.product.findMany({
      where: whereClause,
      include: {
        reviews: {
          where: { isApproved: true },
          select: { rating: true },
        },
      },
      take: limit,
      orderBy: [{ isFeatured: 'desc' }, { badge: 'desc' }],
    });

    return items.map(formatDbProduct);
  } catch (err) {
    console.error('Failed to query featured products from DB:', err);
    return [];
  }
}
