import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
    },
  },
}));

describe('Forgot Password API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 when email is missing or invalid', async () => {
    const req = new Request('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'invalid-email' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Please provide a valid email address');
  });

  it('creates token and returns success when user exists', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: 'usr-1',
      email: 'collector@meadowmist.in',
      isActive: true,
    } as any);

    vi.mocked(prisma.passwordResetToken.create).mockResolvedValue({
      id: 'token-1',
    } as any);

    const req = new Request('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'collector@meadowmist.in' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.resetToken).toBeDefined();
    expect(prisma.passwordResetToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'usr-1',
        }),
      })
    );
  });

  it('returns generic success message when user does not exist without creating token', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'nonexistent@meadowmist.in' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.resetToken).toBeUndefined();
    expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
  });
});
