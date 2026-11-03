import { describe, it, expect, vi, beforeEach } from 'vitest';
import { proxy } from './proxy';
import { verifyToken, SESSION_COOKIE_NAME, checkEndpointRateLimit } from '@meadowmist/shared';
import type { NextRequest } from 'next/server';

vi.mock('@meadowmist/shared', () => ({
  verifyToken: vi.fn(),
  SESSION_COOKIE_NAME: 'mm_customer_session',
  checkEndpointRateLimit: vi.fn().mockResolvedValue({ allowed: true, remaining: 10, resetSeconds: 0 }),
}));

function createMockRequest(pathname: string, cookieValue?: string): NextRequest {
  const url = `http://localhost:3000${pathname}`;
  return {
    nextUrl: { pathname },
    url,
    headers: {
      get: vi.fn().mockReturnValue('127.0.0.1'),
    },
    cookies: {
      get: vi.fn().mockImplementation((name: string) => {
        if (name === SESSION_COOKIE_NAME && cookieValue) {
          return { name, value: cookieValue };
        }
        return undefined;
      }),
    },
  } as unknown as NextRequest;
}

describe('Storefront Proxy Authentication Guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated visitor attempting /checkout to login with redirect param', async () => {
    const req = createMockRequest('/checkout');
    const res = await proxy(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toBe('http://localhost:3000/login?redirect=%2Fcheckout');
  });

  it('allows authenticated customer with valid session cookie to access /checkout', async () => {
    vi.mocked(verifyToken).mockResolvedValue({
      userId: 'cust_123',
      email: 'priya@example.com',
      name: 'Priya',
      role: 'CUSTOMER',
    });

    const req = createMockRequest('/checkout', 'valid_jwt_token');
    const res = await proxy(req);

    expect(res.status).toBe(200);
  });

  it('redirects visitor with invalid or expired session cookie attempting /checkout to login', async () => {
    vi.mocked(verifyToken).mockResolvedValue(null);

    const req = createMockRequest('/checkout', 'expired_jwt_token');
    const res = await proxy(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toBe('http://localhost:3000/login?redirect=%2Fcheckout');
  });

  it('redirects unauthenticated visitor attempting /account to login with redirect param', async () => {
    const req = createMockRequest('/account/orders');
    const res = await proxy(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toBe('http://localhost:3000/login?redirect=%2Faccount%2Forders');
  });

  it('returns 401 JSON for unauthenticated request to /api/account endpoint', async () => {
    const req = createMockRequest('/api/account/addresses');
    const res = await proxy(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('allows unauthenticated visitor to freely access public catalog route', async () => {
    const req = createMockRequest('/catalog');
    const res = await proxy(req);

    expect(res.status).toBe(200);
  });

  it('returns 429 when rate limit is exceeded on sensitive routes', async () => {
    vi.mocked(checkEndpointRateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetSeconds: 60,
    });

    const req = createMockRequest('/checkout');
    const res = await proxy(req);

    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('60');
  });
});
