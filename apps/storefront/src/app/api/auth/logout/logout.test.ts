import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { clearSessionCookie } from '@/lib/session';

vi.mock('@/lib/session', () => ({
  clearSessionCookie: vi.fn(),
}));

describe('Storefront Customer Logout Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clears storefront session cookie and returns success', async () => {
    const req = new Request('http://localhost:3000/api/auth/logout', { method: 'POST' });
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(clearSessionCookie).toHaveBeenCalledWith(false);
  });
});
