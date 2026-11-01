import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from './route';
import { getSessionUser } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { comparePassword, hashPassword } from '@/lib/password';

vi.mock('@/lib/session', () => ({
  getSessionUser: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/password', () => ({
  comparePassword: vi.fn(),
  hashPassword: vi.fn(),
}));

describe('Storefront Customer Profile API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET returns 401 when customer is unauthenticated', async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('GET returns customer profile details', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'usr_1',
      email: 'customer@example.com',
      name: 'Customer',
      role: 'CUSTOMER',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'usr_1',
      name: 'Tara Sharma',
      email: 'customer@example.com',
      phone: '+919988776655',
      role: 'CUSTOMER',
      createdAt: new Date().toISOString(),
    } as any);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.name).toBe('Tara Sharma');
  });

  it('PATCH rejects password update when current password is invalid', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'usr_1',
      email: 'customer@example.com',
      name: 'Customer',
      role: 'CUSTOMER',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'usr_1',
      passwordHash: 'hashed_pw',
    } as any);

    vi.mocked(comparePassword).mockResolvedValue(false);

    const req = new Request('http://localhost:3000/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: 'wrongpassword', newPassword: 'newsecurepass123' }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Incorrect current password');
  });

  it('PATCH updates profile name, phone, and hashed password when valid', async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      userId: 'usr_1',
      email: 'customer@example.com',
      name: 'Customer',
      role: 'CUSTOMER',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'usr_1',
      passwordHash: 'hashed_pw',
    } as any);

    vi.mocked(comparePassword).mockResolvedValue(true);
    vi.mocked(hashPassword).mockResolvedValue('new_hashed_pw');

    vi.mocked(prisma.user.update).mockResolvedValue({
      id: 'usr_1',
      name: 'Tara Sen',
      email: 'customer@example.com',
      phone: '+919988776655',
      role: 'CUSTOMER',
    } as any);

    const req = new Request('http://localhost:3000/api/account/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tara Sen',
        phone: '+919988776655',
        currentPassword: 'correctpassword',
        newPassword: 'brandnewpassword123',
      }),
    });

    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.name).toBe('Tara Sen');
  });
});

