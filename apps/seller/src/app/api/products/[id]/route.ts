import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSessionUser } from '@/lib/session';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        variants: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error('Product GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 });
  }
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const admin = await getAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
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
      stockQuantity,
      lowStockThreshold,
      isFeatured,
      isActive,
    } = body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name !== undefined ? String(name).trim() : existing.name,
        slug: slug !== undefined ? String(slug).trim() : existing.slug,
        description: description !== undefined ? String(description).trim() : existing.description,
        price: price !== undefined ? Number(price) : existing.price,
        salePrice: salePrice !== undefined ? (salePrice ? Number(salePrice) : null) : existing.salePrice,
        category: category !== undefined ? String(category).trim().toLowerCase() : existing.category,
        subCategory: subCategory !== undefined ? String(subCategory).trim().toLowerCase() : existing.subCategory,
        images: images !== undefined ? (typeof images === 'string' ? images : JSON.stringify(images)) : existing.images,
        materials: materials !== undefined ? (typeof materials === 'string' ? materials : JSON.stringify(materials)) : existing.materials,
        dimensions: dimensions !== undefined ? (dimensions ? String(dimensions).trim() : null) : existing.dimensions,
        badge: badge !== undefined ? badge : existing.badge,
        colorFamily: colorFamily !== undefined ? colorFamily : existing.colorFamily,
        scentFamily: scentFamily !== undefined ? scentFamily : existing.scentFamily,
        scentNotes: scentNotes !== undefined ? (typeof scentNotes === 'string' ? scentNotes : JSON.stringify(scentNotes)) : existing.scentNotes,
        customOptions: customOptions !== undefined ? (typeof customOptions === 'string' ? customOptions : JSON.stringify(customOptions)) : existing.customOptions,
        stockQuantity: stockQuantity !== undefined ? Number(stockQuantity) : existing.stockQuantity,
        lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : existing.lowStockThreshold,
        inStock: stockQuantity !== undefined ? Number(stockQuantity) > 0 : existing.inStock,
        isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : existing.isFeatured,
        isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
      },
      include: {
        variants: true,
      },
    });

    return NextResponse.json({ product: updated });
  } catch (error) {
    console.error('Product PUT error:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const admin = await getAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;

    const orderItemCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItemCount > 0) {
      await prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ success: true, archived: true });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    console.error('Product DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
