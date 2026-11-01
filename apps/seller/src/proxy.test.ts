import { describe, it, expect, vi, beforeEach } from 'vitest';
import { proxy } from './proxy';
import { verifyToken, ADMIN_COOKIE_NAME } from '@meadowmist/shared';
import type { NextRequest } from 'next/server';

vi.mock('@meadowmist/shared', () => ({
  verifyToken: vi.fn(),
  ADMIN_COOKIE_NAME: 'mm_admin_session',
}));

function createMockRequest(pathname: string, cookieValue?: string): NextRequest {
  const url = `http://localhost:3001${pathname}`;
  return {
    nextUrl: { pathname },
    url,
    cookies: {
      get: vi.fn().mockImplementation((name: string) => {
        if (name === ADMIN_COOKIE_NAME && cookieValue) {
          return { name, value: cookieValue };
        }
        return undefined;
      }),
    },
  } as unknown as NextRequest;
}

describe('Seller Admin Proxy RBAC Guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows unauthenticated request to /api/auth/login', async () => {
    const req = createMockRequest('/api/auth/login');
    const res = await proxy(req);

    expect(res.status).toBe(200);
  });

  it('allows unauthenticated request to /api/health for keep-alive monitoring', async () => {
    const req = createMockRequest('/api/health');
    const res = await proxy(req);

    expect(res.status).toBe(200);
  });

  it('redirects unauthenticated user attempting /orders to /login', async () => {
    const req = createMockRequest('/orders');
    const res = await proxy(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toBe('http://localhost:3001/login');
  });

  it('returns 401 for unauthenticated request to /api/orders', async () => {
    const req = createMockRequest('/api/orders');
    const res = await proxy(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('redirects logged-in ADMIN visiting /login to dashboard root', async () => {
    vi.mocked(verifyToken).mockResolvedValue({
      userId: 'admin_1',
      email: 'admin@meadowmist.in',
      name: 'Store Owner',
      role: 'ADMIN',
    });

    const req = createMockRequest('/login', 'valid_admin_jwt');
    const res = await proxy(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toBe('http://localhost:3001/');
  });

  it('rejects user with CUSTOMER role attempting to access seller /orders', async () => {
    vi.mocked(verifyToken).mockResolvedValue({
      userId: 'cust_1',
      email: 'customer@example.com',
      name: 'Customer',
      role: 'CUSTOMER',
    });

    const req = createMockRequest('/orders', 'customer_jwt');
    const res = await proxy(req);

    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toBe('http://localhost:3001/login');
  });

  it('allows authenticated user with ADMIN role to access /orders', async () => {
    vi.mocked(verifyToken).mockResolvedValue({
      userId: 'admin_1',
      email: 'admin@meadowmist.in',
      name: 'Store Owner',
      role: 'ADMIN',
    });

    const req = createMockRequest('/orders', 'valid_admin_jwt');
    const res = await proxy(req);

    expect(res.status).toBe(200);
  });
});
