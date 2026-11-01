import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/password';
import { signToken } from '@/lib/auth';
import { setSessionCookie, setTrustedDeviceCookie } from '@/lib/session';
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
  setSessionCookie: vi.fn(),
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

describe('Storefront Login API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyTurnstileToken).mockResolvedValue({ success: true });
  });

  it('returns 400 when email or password is missing', async () => {
    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Email and password are required');
  });

  it('returns 429 when checkLoginAttempt indicates lockout', async () => {
    vi.mocked(checkLoginAttempt).mockReturnValue({
      allowed: false,
      requireStepUp: true,
      remainingSeconds: 45,
      attemptCount: 5,
      targetAttemptCount: 2,
    });

    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'locked@example.com',
        password: 'Password123!',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('45');
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

    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'victim@example.com',
        password: 'Password123!',
        turnstileToken: 'bad_token',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Security verification failed');
    expect(body.requireTurnstile).toBe(true);
  });

  it('records failed attempt and returns 401 when user does not exist', async () => {
    vi.mocked(checkLoginAttempt).mockReturnValue({
      allowed: true,
      requireStepUp: false,
      remainingSeconds: 0,
      attemptCount: 1,
      targetAttemptCount: 1,
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(recordFailedAttempt).mockReturnValue({
      allowed: true,
      requireStepUp: false,
      remainingSeconds: 0,
      attemptCount: 2,
      targetAttemptCount: 2,
    });

    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'WrongPassword123!',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    expect(recordFailedAttempt).toHaveBeenCalledWith('127.0.0.1', 'nonexistent@example.com');
  });

  it('resets failed attempts and returns 200 on valid credentials', async () => {
    vi.mocked(checkLoginAttempt).mockReturnValue({
      allowed: true,
      requireStepUp: false,
      remainingSeconds: 0,
      attemptCount: 0,
      targetAttemptCount: 0,
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'user_1',
      email: 'valid@example.com',
      passwordHash: 'hashed_pw',
      name: 'Ananya',
      role: 'CUSTOMER',
      isActive: true,
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    vi.mocked(comparePassword).mockResolvedValue(true);
    vi.mocked(signToken).mockResolvedValue('jwt_token_123');

    const req = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'valid@example.com',
        password: 'CorrectPassword123!',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(resetFailedAttempts).toHaveBeenCalledWith('127.0.0.1', 'valid@example.com');
    expect(setSessionCookie).toHaveBeenCalledWith('jwt_token_123', false);
    expect(setTrustedDeviceCookie).toHaveBeenCalled();

    const body = await res.json();
    expect(body.user.email).toBe('valid@example.com');
  });
});
