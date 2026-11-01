import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/password';
import { signToken } from '@/lib/auth';
import { setAdminSessionCookie } from '@/lib/session';
import {
  checkLoginAttempt,
  recordFailedAttempt,
  resetFailedAttempts,
  verifyTurnstileToken,
} from '@meadowmist/shared';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('@/lib/password', () => ({
  comparePassword: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  signToken: vi.fn(),
}));

vi.mock('@/lib/session', () => ({
  setAdminSessionCookie: vi.fn(),
  setTrustedDeviceCookie: vi.fn(),
}));

vi.mock('@meadowmist/shared', async () => {
  const actual = await vi.importActual<typeof import('@meadowmist/shared')>('@meadowmist/shared');
  return {
    ...actual,
    checkLoginAttempt: vi.fn(),
    recordFailedAttempt: vi.fn(),
    resetFailedAttempts: vi.fn(),
    verifyTurnstileToken: vi.fn(),
  };
});

describe('Seller Portal Login API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyTurnstileToken).mockResolvedValue({ success: true });
  });

  it('returns 400 when email or password is empty', async () => {
    const req = new Request('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: '' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Email and password are required');
  });

  it('returns 429 when seller account is temporarily locked', async () => {
    vi.mocked(checkLoginAttempt).mockReturnValue({
      allowed: false,
      requireStepUp: true,
      remainingSeconds: 60,
      attemptCount: 6,
      targetAttemptCount: 3,
    });

    const req = new Request('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'artisan@meadowmist.in',
        password: 'AdminPassword123!',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('60');
    const body = await res.json();
    expect(body.error).toContain('Account temporarily locked');
  });

  it('returns 400 when step-up security challenge fails', async () => {
    vi.mocked(checkLoginAttempt).mockReturnValue({
      allowed: true,
      requireStepUp: true,
      remainingSeconds: 0,
      attemptCount: 3,
      targetAttemptCount: 6,
    });

    vi.mocked(verifyTurnstileToken).mockResolvedValue({
      success: false,
      errorCodes: ['invalid-input-response'],
    });

    const req = new Request('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'artisan@meadowmist.in',
        password: 'AdminPassword123!',
        turnstileToken: 'invalid_token',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Security verification failed');
    expect(body.requireTurnstile).toBe(true);
  });

  it('records failed attempt and rejects user if account is not ADMIN', async () => {
    vi.mocked(checkLoginAttempt).mockReturnValue({
      allowed: true,
      requireStepUp: false,
      remainingSeconds: 0,
      attemptCount: 0,
      targetAttemptCount: 0,
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'cust_1',
      email: 'customer@meadowmist.in',
      passwordHash: 'valid_hashed_pw',
      name: 'Customer',
      role: 'CUSTOMER',
      isActive: true,
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(recordFailedAttempt).mockReturnValue({
      allowed: true,
      requireStepUp: false,
      remainingSeconds: 0,
      attemptCount: 1,
      targetAttemptCount: 1,
    });

    const req = new Request('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer@meadowmist.in',
        password: 'Password123!',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(recordFailedAttempt).toHaveBeenCalledWith('127.0.0.1', 'customer@meadowmist.in');
  });

  it('authenticates admin successfully, resets lockouts, sets admin session cookie, and returns 200', async () => {
    vi.mocked(checkLoginAttempt).mockReturnValue({
      allowed: true,
      requireStepUp: false,
      remainingSeconds: 0,
      attemptCount: 0,
      targetAttemptCount: 0,
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'admin_1',
      email: 'artisan@meadowmist.in',
      passwordHash: 'valid_hashed_pw',
      name: 'Master Artisan',
      role: 'ADMIN',
      isActive: true,
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(comparePassword).mockResolvedValue(true);
    vi.mocked(signToken).mockResolvedValue('admin_jwt_token');

    const req = new Request('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'artisan@meadowmist.in',
        password: 'AdminPassword123!',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(resetFailedAttempts).toHaveBeenCalledWith('127.0.0.1', 'artisan@meadowmist.in');
    expect(setAdminSessionCookie).toHaveBeenCalledWith('admin_jwt_token');

    const body = await res.json();
    expect(body.user.role).toBe('ADMIN');
    expect(body.user.email).toBe('artisan@meadowmist.in');
  });
});
