import fs from 'fs/promises';
import path from 'path';

export async function saveReviewPhoto(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  let publicDir = path.join(process.cwd(), 'public');
  if (path.basename(process.cwd()) !== 'storefront') {
    publicDir = path.join(process.cwd(), 'apps', 'storefront', 'public');
  }
  const uploadsDir = path.join(publicDir, 'uploads', 'reviews');

  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueName = `${Date.now()}_${safeName}`;
  const filePath = path.join(uploadsDir, uniqueName);

  await fs.writeFile(filePath, buffer);

  return `/uploads/reviews/${uniqueName}`;
}
