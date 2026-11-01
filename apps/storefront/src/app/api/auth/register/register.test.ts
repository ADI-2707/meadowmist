import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { signToken } from '@/lib/auth';
import { setSessionCookie } from '@/lib/session';
import { verifyTurnstileToken } from '@meadowmist/shared';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/password', () => ({
  hashPassword: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({
  signToken: vi.fn(),
}));

vi.mock('@/lib/session', () => ({
  setSessionCookie: vi.fn(),
}));

vi.mock('@meadowmist/shared', () => ({
  verifyTurnstileToken: vi.fn(),
}));

describe('Storefront Customer Registration Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(verifyTurnstileToken).mockResolvedValue({ success: true });
  });

  it('returns 400 when required fields are missing or password is too short', async () => {
    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ananya', email: 'ananya@example.com', password: '123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('6 characters');
  });

  it('returns 400 when turnstile bot verification fails on registration', async () => {
    vi.mocked(verifyTurnstileToken).mockResolvedValue({
      success: false,
      errorCodes: ['invalid-input-response'],
    });

    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Bot User',
        email: 'bot@example.com',
        password: 'Password123!',
        turnstileToken: 'fraudulent_token',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Security verification failed');
  });

  it('returns 409 when user with email already exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'existing_usr' } as any);

    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ananya', email: 'ananya@example.com', password: 'Password123!' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('already exists');
  });

  it('successfully creates new user, sets session cookie, and returns 201', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(hashPassword).mockResolvedValue('hashed_secret_password');
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'new_usr_123',
      name: 'Ananya Rao',
      email: 'ananya.rao@example.com',
      passwordHash: 'hashed_secret_password',
      phone: '+919876543210',
      role: 'CUSTOMER',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(signToken).mockResolvedValue('token_cust_123');

    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ananya Rao',
        email: 'ananya.rao@example.com',
        password: 'Password123!',
        phone: '+919876543210',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    expect(setSessionCookie).toHaveBeenCalledWith('token_cust_123', false);
    const body = await res.json();
    expect(body.user.email).toBe('ananya.rao@example.com');
  });
});
