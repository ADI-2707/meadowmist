import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/password';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    passwordResetToken: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    $transaction: vi.fn((promises) => Promise.all(promises)),
  },
}));

vi.mock('@/lib/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-new-password'),
}));

describe('Reset Password API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when token is missing', async () => {
    const req = new Request('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: '', newPassword: 'securePassword123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Reset token is required');
  });

  it('returns 400 when newPassword is less than 6 characters', async () => {
    const req = new Request('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'sampletoken123', newPassword: '123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Password must be at least 6 characters');
  });

  it('returns 400 when token is expired or not found', async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'invalidtoken', newPassword: 'securePassword123' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid or expired password reset link');
  });

  it('updates password and marks token used on valid submission', async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
      id: 'token-rec-1',
      userId: 'usr-1',
      usedAt: null,
      expiresAt: new Date(Date.now() + 100000),
      user: { id: 'usr-1' },
    } as any);

    const req = new Request('http://localhost:3000/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token: 'validtoken123', newPassword: 'newValidPassword456' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(hashPassword).toHaveBeenCalledWith('newValidPassword456');
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'usr-1' },
        data: { passwordHash: 'hashed-new-password' },
      })
    );
  });
});

