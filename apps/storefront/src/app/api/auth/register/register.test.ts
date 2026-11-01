import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';
import { signToken } from '@/lib/auth';
import { setSessionCookie } from '@/lib/session';

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

describe('Storefront Customer Registration Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

  it('returns 409 when user with email already exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: 'existing_usr' } as any);

    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Ananya', email: 'ananya@example.com', password: 'password123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toContain('already exists');
  });

  it('creates user, hashes password, sets session cookie and returns user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(hashPassword).mockResolvedValue('hashed_pw_secret');
    vi.mocked(prisma.user.create).mockResolvedValue({
      id: 'usr_new_1',
      name: 'Ananya',
      email: 'ananya@example.com',
      phone: '+919876543210',
      role: 'CUSTOMER',
    } as any);
    vi.mocked(signToken).mockResolvedValue('jwt_token_sample');

    const req = new Request('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ananya',
        email: 'ANANYA@EXAMPLE.COM',
        password: 'password123',
        phone: '+919876543210',
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user.email).toBe('ananya@example.com');
    expect(setSessionCookie).toHaveBeenCalledWith('jwt_token_sample', false);
  });
});

