import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { getSessionUser } from '@/lib/session';
import { saveReviewPhoto } from '@/lib/storage';

vi.mock('@/lib/session', () => ({
  getSessionUser: vi.fn(),
}));

vi.mock('@/lib/storage', () => ({
  saveReviewPhoto: vi.fn(),
}));

describe('Review Photo Upload API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const formData = new FormData();
    const req = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request;

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when no file is uploaded', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({ userId: 'u1', email: 'u@test.com', role: 'CUSTOMER' });

    const formData = new FormData();
    const req = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request;

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 400 when file format is invalid', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({ userId: 'u1', email: 'u@test.com', role: 'CUSTOMER' });

    const formData = new FormData();
    const file = new File(['dummy'], 'test.txt', { type: 'text/plain' });
    formData.append('file', file);

    const req = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid file format');
  });

  it('uploads valid image file and returns 201 with url', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({ userId: 'u1', email: 'u@test.com', role: 'CUSTOMER' });
    vi.mocked(saveReviewPhoto).mockResolvedValue('/uploads/reviews/mock_photo.jpg');

    const formData = new FormData();
    const file = new File(['imagecontent'], 'candle.jpg', { type: 'image/jpeg' });
    formData.append('file', file);

    const req = {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request;

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.url).toBe('/uploads/reviews/mock_photo.jpg');
  });
});
