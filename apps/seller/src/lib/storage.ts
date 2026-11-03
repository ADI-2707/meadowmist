import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';

export async function optimizeImage(buffer: Buffer): Promise<{ buffer: Buffer; contentType: string }> {
  try {
    const optimized = await sharp(buffer)
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    return { buffer: optimized, contentType: 'image/webp' };
  } catch {
    return { buffer, contentType: 'image/jpeg' };
  }
}

export async function saveUploadedFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const rawBuffer = Buffer.from(bytes);
  const { buffer, contentType } = await optimizeImage(rawBuffer);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'meadowmist';

  if (supabaseUrl && supabaseKey) {
    const rawSafeName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `products/${Date.now()}_${rawSafeName}.webp`;
    const cleanUrl = supabaseUrl.replace(/\/$/, '');
    const uploadUrl = `${cleanUrl}/storage/v1/object/${bucketName}/${uniqueName}`;

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        apikey: supabaseKey,
        'Content-Type': contentType,
      },
      body: buffer,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Supabase storage upload error:', errText);
      throw new Error(`Failed to upload to Supabase storage: ${res.statusText}`);
    }

    return `${cleanUrl}/storage/v1/object/public/${bucketName}/${uniqueName}`;
  }

  const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }

  const rawSafeName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueName = `${Date.now()}_${rawSafeName}.webp`;
  const filePath = path.join(uploadsDir, uniqueName);

  await fs.writeFile(filePath, buffer);

  return `/uploads/${uniqueName}`;
}

export async function deleteUploadedFile(fileUrl: string): Promise<boolean> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'meadowmist';

  if (supabaseUrl && supabaseKey && fileUrl.includes(bucketName)) {
    try {
      const cleanUrl = supabaseUrl.replace(/\/$/, '');
      const prefix = `/storage/v1/object/public/${bucketName}/`;
      const idx = fileUrl.indexOf(prefix);
      if (idx !== -1) {
        const filePath = decodeURIComponent(fileUrl.substring(idx + prefix.length));
        const deleteUrl = `${cleanUrl}/storage/v1/object/${bucketName}/${filePath}`;
        const res = await fetch(deleteUrl, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${supabaseKey}`,
            apikey: supabaseKey,
          },
        });
        return res.ok;
      }
    } catch {
      return false;
    }
  }

  if (fileUrl.startsWith('/uploads/')) {
    try {
      const fileName = path.basename(fileUrl);
      const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }

  return false;
}
