import { NextResponse } from 'next/server';
import { prisma, Prisma } from '@/lib/prisma';
import { getAdminSessionUser } from '@/lib/session';
import { parsePaginationParams } from '@meadowmist/shared';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');
    const status = url.searchParams.get('status');

    const whereClause: {
      category?: string;
      isActive?: boolean;
      OR?: Array<{
        name?: { contains: string };
        description?: { contains: string };
        materials?: { contains: string };
        subCategory?: { contains: string };
        colorFamily?: { contains: string };
      }>;
    } = {};

    if (category && category !== 'ALL') {
      whereClause.category = category;
    }

    if (search && search.trim()) {
      const q = search.trim();
      whereClause.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { materials: { contains: q } },
        { subCategory: { contains: q } },
        { colorFamily: { contains: q } },
      ];
    }

    if (status === 'ACTIVE') {
      whereClause.isActive = true;
    } else if (status === 'INACTIVE') {
      whereClause.isActive = false;
    }

    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');
    const isPaginated = pageParam !== null || limitParam !== null;
    const { page, limit, skip } = parsePaginationParams(url, 20, 100);

    const [total, products] = await Promise.all([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        include: {
          reviews: {
            where: { isApproved: true },
            select: { rating: true },
          },
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        ...(isPaginated ? { skip, take: limit } : {}),
      }),
    ]);

    const formatted = products.map((p) => {
      const revs = p.reviews || [];
      const reviewCount = revs.length;
      const ratingSum = revs.reduce((sum, r) => sum + r.rating, 0);
      const averageRating = reviewCount > 0 ? Number((ratingSum / reviewCount).toFixed(1)) : 5;
      return {
        ...p,
        averageRating,
        reviewCount,
      };
    });

    const totalPages = isPaginated ? Math.ceil(total / limit) : 1;

    return NextResponse.json({
      products: formatted,
      pagination: {
        page: isPaginated ? page : 1,
        limit: isPaginated ? limit : total,
        total,
        totalPages,
        hasNext: isPaginated ? page < totalPages : false,
        hasPrev: isPaginated ? page > 1 : false,
      },
    });
  } catch (error) {
    console.error('Products GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      slug,
      description,
      price,
      salePrice,
      category,
      subCategory,
      images,
      materials,
      dimensions,
      badge,
      colorFamily,
      scentFamily,
      scentNotes,
      customOptions,
      stockQuantity = 0,
      lowStockThreshold = 5,
      isFeatured = false,
      isActive = true,
    } = body;

    if (!name || !price || !category || !subCategory) {
      return NextResponse.json(
        { error: 'Name, price, category, and subcategory are required' },
        { status: 400 }
      );
    }

    const generatedSlug =
      slug && slug.trim()
        ? slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-')
        : name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');

    const existing = await prisma.product.findUnique({
      where: { slug: generatedSlug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A product with this slug already exists. Please choose a unique slug.' },
        { status: 409 }
      );
    }

    const initialStock = Number(stockQuantity) || 0;

    const product = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const created = await tx.product.create({
        data: {
          name: String(name).trim(),
          slug: generatedSlug,
          description: description ? String(description).trim() : '',
          price: Number(price),
          salePrice: salePrice ? Number(salePrice) : null,
          category: String(category).trim().toLowerCase(),
          subCategory: String(subCategory).trim().toLowerCase(),
          images: typeof images === 'string' ? images : JSON.stringify(images || []),
          materials: typeof materials === 'string' ? materials : JSON.stringify(materials || []),
          dimensions: dimensions ? String(dimensions).trim() : null,
          badge: badge || null,
          colorFamily: colorFamily || 'ivory',
          scentFamily: scentFamily || null,
          scentNotes: typeof scentNotes === 'string' ? scentNotes : JSON.stringify(scentNotes || []),
          customOptions: typeof customOptions === 'string' ? customOptions : JSON.stringify(customOptions || {}),
          stockQuantity: initialStock,
          lowStockThreshold: Number(lowStockThreshold) || 5,
          inStock: initialStock > 0,
          isFeatured: Boolean(isFeatured),
          isActive: Boolean(isActive),
        },
      });

      if (initialStock > 0) {
        await tx.inventoryLog.create({
          data: {
            productId: created.id,
            changeQuantity: initialStock,
            newQuantity: initialStock,
            reason: 'RESTOCK',
            note: 'Initial catalog creation',
          },
        });
      }

      return created;
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Product POST error:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}
