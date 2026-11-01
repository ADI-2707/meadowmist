import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSessionUser } from '@/lib/session';

function parseCsv(content: string): Record<string, string>[] {
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      if (inQuotes && content[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (current.trim().length > 0) {
        lines.push(current);
      }
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim().length > 0) {
    lines.push(current);
  }

  if (lines.length < 2) return [];

  const splitRow = (row: string): string[] => {
    const cols: string[] = [];
    let field = '';
    let inQ = false;

    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === '"') {
        if (inQ && row[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQ = !inQ;
        }
      } else if (c === ',' && !inQ) {
        cols.push(field);
        field = '';
      } else {
        field += c;
      }
    }
    cols.push(field);
    return cols;
  };

  const headers = splitRow(lines[0]).map((h) => h.trim());
  const records: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitRow(lines[i]);
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      record[h] = values[idx] !== undefined ? values[idx].trim() : '';
    });
    records.push(record);
  }

  return records;
}

export async function POST(request: Request) {
  try {
    const admin = await getAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let csvText = '';
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'CSV file is required' }, { status: 400 });
      }
      csvText = await file.text();
    } else {
      const body = await request.json();
      csvText = body.csvContent || '';
    }

    if (!csvText || !csvText.trim()) {
      return NextResponse.json({ error: 'Empty or missing CSV content' }, { status: 400 });
    }

    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      return NextResponse.json({ error: 'No valid data rows found in CSV' }, { status: 400 });
    }

    let createdCount = 0;
    let updatedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;

      if (!row.name || !row.slug || !row.price) {
        errors.push(`Row ${rowNumber}: name, slug, and price are required`);
        continue;
      }

      const numPrice = Number(row.price);
      if (isNaN(numPrice) || numPrice < 0) {
        errors.push(`Row ${rowNumber}: price must be a valid positive number`);
        continue;
      }

      const category = (row.category || 'candle').toLowerCase();
      if (category !== 'candle' && category !== 'ceramic') {
        errors.push(`Row ${rowNumber}: category must be "candle" or "ceramic"`);
        continue;
      }

      const stockQuantity = Number(row.stockQuantity) || 0;
      const lowStockThreshold = Number(row.lowStockThreshold) || 5;
      const salePrice = row.salePrice && !isNaN(Number(row.salePrice)) ? Number(row.salePrice) : null;
      const isActive = row.isActive !== 'false';
      const inStock = stockQuantity > 0;

      const existing = await prisma.product.findUnique({
        where: { slug: row.slug },
      });

      if (existing) {
        await prisma.product.update({
          where: { slug: row.slug },
          data: {
            name: row.name.trim(),
            category,
            subCategory: row.subCategory?.trim() || existing.subCategory,
            price: numPrice,
            salePrice,
            stockQuantity,
            lowStockThreshold,
            inStock,
            isActive,
            colorFamily: row.colorFamily?.trim() || existing.colorFamily,
            scentFamily: row.scentFamily?.trim() || existing.scentFamily,
            badge: row.badge?.trim() || existing.badge,
          },
        });
        updatedCount++;
      } else {
        await prisma.product.create({
          data: {
            slug: row.slug.trim(),
            name: row.name.trim(),
            description: `${row.name.trim()} - handcrafted studio collection piece`,
            category,
            subCategory: row.subCategory?.trim() || (category === 'candle' ? 'pillar' : 'vessels'),
            price: numPrice,
            salePrice,
            images: JSON.stringify(['/images/products/sunflower-wax-cluster-yellow.jpg']),
            materials: JSON.stringify(category === 'candle' ? ['Soy Wax', 'Cotton Wick'] : ['Stoneware Clay', 'Natural Glaze']),
            colorFamily: row.colorFamily?.trim() || 'ivory',
            scentFamily: row.scentFamily?.trim() || (category === 'candle' ? 'floral' : null),
            badge: row.badge?.trim() || null,
            stockQuantity,
            lowStockThreshold,
            inStock,
            isActive,
          },
        });
        createdCount++;
      }
    }

    return NextResponse.json({
      success: true,
      totalProcessed: rows.length,
      createdCount,
      updatedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Catalog CSV import error:', error);
    return NextResponse.json({ error: 'Failed to process CSV import' }, { status: 500 });
  }
}

