import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/password';
import { signToken } from '@/lib/auth';
import {
  setAdminSessionCookie,
  setTrustedDeviceCookie,
  getTrustedDeviceToken,
} from '@/lib/session';
import {
  checkLoginAttempt,
  recordFailedAttempt,
  resetFailedAttempts,
  verifyTurnstileToken,
  generateTotpSecret,
  generateTotpToken,
} from '@meadowmist/shared';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    trustedDevice: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
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
  getTrustedDeviceToken: vi.fn(),
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
    vi.mocked(getTrustedDeviceToken).mockResolvedValue(null);
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
    } as any);

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
      twoFactorEnabled: false,
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

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
    expect(setTrustedDeviceCookie).toHaveBeenCalled();

    const body = await res.json();
    expect(body.user.role).toBe('ADMIN');
    expect(body.user.email).toBe('artisan@meadowmist.in');
  });

  it('prompts require2FA when twoFactorEnabled is true on unrecognized device', async () => {
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
      twoFactorEnabled: true,
      twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    vi.mocked(comparePassword).mockResolvedValue(true);

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
    const body = await res.json();
    expect(body.require2FA).toBe(true);
    expect(body.email).toBe('artisan@meadowmist.in');
    expect(setAdminSessionCookie).not.toHaveBeenCalled();
  });

  it('rejects login with 401 when invalid totpCode is provided for 2FA', async () => {
    vi.mocked(checkLoginAttempt).mockReturnValue({
      allowed: true,
      requireStepUp: false,
      remainingSeconds: 0,
      attemptCount: 0,
      targetAttemptCount: 0,
    });

    vi.mocked(recordFailedAttempt).mockReturnValue({
      allowed: true,
      requireStepUp: false,
      remainingSeconds: 0,
      attemptCount: 1,
      targetAttemptCount: 1,
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'admin_1',
      email: 'artisan@meadowmist.in',
      passwordHash: 'valid_hashed_pw',
      name: 'Master Artisan',
      role: 'ADMIN',
      isActive: true,
      twoFactorEnabled: true,
      twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    vi.mocked(comparePassword).mockResolvedValue(true);

    const req = new Request('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'artisan@meadowmist.in',
        password: 'AdminPassword123!',
        totpCode: '000000',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Invalid two-factor authentication code');
    expect(setAdminSessionCookie).not.toHaveBeenCalled();
  });

  it('authenticates admin successfully when valid totpCode is provided', async () => {
    const secret = generateTotpSecret();
    const validTotp = generateTotpToken(secret);

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
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    vi.mocked(comparePassword).mockResolvedValue(true);
    vi.mocked(signToken).mockResolvedValue('admin_jwt_token_2fa');

    const req = new Request('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'artisan@meadowmist.in',
        password: 'AdminPassword123!',
        totpCode: validTotp,
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(setAdminSessionCookie).toHaveBeenCalledWith('admin_jwt_token_2fa');
    expect(setTrustedDeviceCookie).toHaveBeenCalled();
    const body = await res.json();
    expect(body.user.email).toBe('artisan@meadowmist.in');
  });

  it('bypasses 2FA challenge when client presents valid trusted device cookie', async () => {
    vi.mocked(checkLoginAttempt).mockReturnValue({
      allowed: true,
      requireStepUp: false,
      remainingSeconds: 0,
      attemptCount: 0,
      targetAttemptCount: 0,
    });

    vi.mocked(getTrustedDeviceToken).mockResolvedValue('valid_trusted_token');

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'admin_1',
      email: 'artisan@meadowmist.in',
      passwordHash: 'valid_hashed_pw',
      name: 'Master Artisan',
      role: 'ADMIN',
      isActive: true,
      twoFactorEnabled: true,
      twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);

    vi.mocked(prisma.trustedDevice.findUnique).mockResolvedValue({
      id: 'dev_1',
      userId: 'admin_1',
      deviceHash: 'some_hash',
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      lastUsedAt: new Date(),
      deviceName: null,
      userAgent: null,
      lastIp: null,
    });

    vi.mocked(comparePassword).mockResolvedValue(true);
    vi.mocked(signToken).mockResolvedValue('admin_jwt_token_trusted');

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
    expect(setAdminSessionCookie).toHaveBeenCalledWith('admin_jwt_token_trusted');
  });
});
