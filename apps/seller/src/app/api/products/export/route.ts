import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSessionUser } from '@/lib/session';

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  try {
    const admin = await getAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    const headers = [
      'id',
      'name',
      'slug',
      'category',
      'subCategory',
      'price',
      'salePrice',
      'stockQuantity',
      'lowStockThreshold',
      'inStock',
      'colorFamily',
      'scentFamily',
      'badge',
      'isActive',
    ];

    const rows = products.map((p) =>
      [
        p.id,
        escapeCsv(p.name),
        escapeCsv(p.slug),
        escapeCsv(p.category),
        escapeCsv(p.subCategory),
        p.price,
        p.salePrice ?? '',
        p.stockQuantity,
        p.lowStockThreshold,
        p.inStock,
        escapeCsv(p.colorFamily),
        escapeCsv(p.scentFamily || ''),
        escapeCsv(p.badge || ''),
        p.isActive,
      ].join(',')
    );

    const csvContent = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="meadow-mist-catalog-export.csv"',
      },
    });
  } catch (error) {
    console.error('Catalog CSV export error:', error);
    return NextResponse.json({ error: 'Failed to export catalog' }, { status: 500 });
  }
}
