import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { clearAdminSessionCookie } from '@/lib/session';

vi.mock('@/lib/session', () => ({
  clearAdminSessionCookie: vi.fn(),
}));

describe('Seller Admin Logout API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clears admin session cookie and returns success', async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(clearAdminSessionCookie).toHaveBeenCalled();
  });
});
