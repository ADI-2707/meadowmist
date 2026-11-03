import { describe, it, expect, vi, beforeEach } from 'vitest';
import { optimizeImage, deleteUploadedFile } from './storage';
import fs from 'fs/promises';

describe('Storage and Image Optimization Engine', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('compresses and converts images using sharp', async () => {
    const fakePixel = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
      0x42, 0x60, 0x82,
    ]);

    const result = await optimizeImage(fakePixel);
    expect(result.contentType).toBe('image/webp');
    expect(result.buffer).toBeInstanceOf(Buffer);
    expect(result.buffer.length).toBeGreaterThan(0);
  });

  it('deletes local files on disk', async () => {
    const unlinkSpy = vi.spyOn(fs, 'unlink').mockResolvedValue(undefined);

    const deleted = await deleteUploadedFile('/uploads/sample_artisan_candle.webp');
    expect(deleted).toBe(true);
    expect(unlinkSpy).toHaveBeenCalledOnce();
  });

  it('calls Supabase storage DELETE when given a remote Supabase URL', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://meadowmist.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test_service_key';
    process.env.SUPABASE_STORAGE_BUCKET = 'meadowmist';

    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);

    const remoteUrl = 'https://meadowmist.supabase.co/storage/v1/object/public/meadowmist/products/123_candle.webp';
    const deleted = await deleteUploadedFile(remoteUrl);

    expect(deleted).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://meadowmist.supabase.co/storage/v1/object/meadowmist/products/123_candle.webp',
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
