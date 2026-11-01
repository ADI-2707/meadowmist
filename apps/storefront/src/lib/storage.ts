import fs from 'fs/promises';
import path from 'path';

export async function saveReviewPhoto(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'meadowmist';

  if (supabaseUrl && supabaseKey) {
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueName = `reviews/${Date.now()}_${safeName}`;
    const cleanUrl = supabaseUrl.replace(/\/$/, '');
    const uploadUrl = `${cleanUrl}/storage/v1/object/${bucketName}/${uniqueName}`;

    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        apikey: supabaseKey,
        'Content-Type': file.type || 'image/jpeg',
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

  // Fallback to local storage (development / unit tests)
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
