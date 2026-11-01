import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as setupPost } from './setup/route';
import { POST as enablePost } from './enable/route';
import { POST as disablePost } from './disable/route';
import { GET as statusGet } from './route';
import { prisma } from '@/lib/prisma';
import { getAdminSessionUser } from '@/lib/session';
import { comparePassword } from '@/lib/password';
import { generateTotpSecret, generateTotpToken } from '@meadowmist/shared';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('@/lib/session', () => ({
  getAdminSessionUser: vi.fn(),
}));

vi.mock('@/lib/password', () => ({
  comparePassword: vi.fn(),
}));

describe('Seller 2FA Management Endpoints', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/2fa/setup', () => {
    it('returns 401 when user is not authenticated as admin', async () => {
      vi.mocked(getAdminSessionUser).mockResolvedValue(null);

      const res = await setupPost();
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('generates secret and QR URI and persists to user record', async () => {
      vi.mocked(getAdminSessionUser).mockResolvedValue({
        userId: 'admin_1',
        email: 'artisan@meadowmist.in',
        name: 'Master Artisan',
        role: 'ADMIN',
      });

      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const res = await setupPost();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(typeof data.secret).toBe('string');
      expect(data.qrUri).toContain('otpauth://totp/');
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'admin_1' },
        data: { twoFactorSecret: data.secret },
      });
    });
  });

  describe('POST /api/auth/2fa/enable', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(getAdminSessionUser).mockResolvedValue(null);

      const req = new Request('http://localhost:3001/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totpCode: '123456' }),
      });

      const res = await enablePost(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 when totpCode is missing', async () => {
      vi.mocked(getAdminSessionUser).mockResolvedValue({
        userId: 'admin_1',
        email: 'artisan@meadowmist.in',
        name: 'Master Artisan',
        role: 'ADMIN',
      });

      const req = new Request('http://localhost:3001/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const res = await enablePost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Verification code is required');
    });

    it('returns 400 when setup has not been initiated', async () => {
      vi.mocked(getAdminSessionUser).mockResolvedValue({
        userId: 'admin_1',
        email: 'artisan@meadowmist.in',
        name: 'Master Artisan',
        role: 'ADMIN',
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'admin_1',
        twoFactorSecret: null,
      } as any);

      const req = new Request('http://localhost:3001/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totpCode: '123456' }),
      });

      const res = await enablePost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('2FA setup has not been initiated');
    });

    it('returns 400 when invalid code is submitted', async () => {
      vi.mocked(getAdminSessionUser).mockResolvedValue({
        userId: 'admin_1',
        email: 'artisan@meadowmist.in',
        name: 'Master Artisan',
        role: 'ADMIN',
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'admin_1',
        twoFactorSecret: 'JBSWY3DPEHPK3PXP',
      } as any);

      const req = new Request('http://localhost:3001/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totpCode: '000000' }),
      });

      const res = await enablePost(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe('Invalid verification code');
    });

    it('activates 2FA when valid code is submitted', async () => {
      const secret = generateTotpSecret();
      const code = generateTotpToken(secret);

      vi.mocked(getAdminSessionUser).mockResolvedValue({
        userId: 'admin_1',
        email: 'artisan@meadowmist.in',
        name: 'Master Artisan',
        role: 'ADMIN',
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'admin_1',
        twoFactorSecret: secret,
      } as any);

      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const req = new Request('http://localhost:3001/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ totpCode: code }),
      });

      const res = await enablePost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'admin_1' },
        data: { twoFactorEnabled: true },
      });
    });
  });

  describe('POST /api/auth/2fa/disable', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(getAdminSessionUser).mockResolvedValue(null);

      const req = new Request('http://localhost:3001/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'secret' }),
      });

      const res = await disablePost(req);
      expect(res.status).toBe(401);
    });

    it('returns 400 when password confirmation is empty', async () => {
      vi.mocked(getAdminSessionUser).mockResolvedValue({
        userId: 'admin_1',
        email: 'artisan@meadowmist.in',
        name: 'Master Artisan',
        role: 'ADMIN',
      });

      const req = new Request('http://localhost:3001/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const res = await disablePost(req);
      expect(res.status).toBe(400);
    });

    it('returns 401 when password confirmation fails', async () => {
      vi.mocked(getAdminSessionUser).mockResolvedValue({
        userId: 'admin_1',
        email: 'artisan@meadowmist.in',
        name: 'Master Artisan',
        role: 'ADMIN',
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'admin_1',
        passwordHash: 'hash',
      } as any);

      vi.mocked(comparePassword).mockResolvedValue(false);

      const req = new Request('http://localhost:3001/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'wrong_password' }),
      });

      const res = await disablePost(req);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.error).toBe('Invalid password');
    });

    it('disables 2FA and resets secret when password matches', async () => {
      vi.mocked(getAdminSessionUser).mockResolvedValue({
        userId: 'admin_1',
        email: 'artisan@meadowmist.in',
        name: 'Master Artisan',
        role: 'ADMIN',
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        id: 'admin_1',
        passwordHash: 'hash',
      } as any);

      vi.mocked(comparePassword).mockResolvedValue(true);
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const req = new Request('http://localhost:3001/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: 'valid_password' }),
      });

      const res = await disablePost(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'admin_1' },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
        },
      });
    });
  });

  describe('GET /api/auth/2fa', () => {
    it('returns 401 when not authenticated', async () => {
      vi.mocked(getAdminSessionUser).mockResolvedValue(null);

      const res = await statusGet();
      expect(res.status).toBe(401);
    });

    it('returns twoFactorEnabled status for authenticated admin', async () => {
      vi.mocked(getAdminSessionUser).mockResolvedValue({
        userId: 'admin_1',
        email: 'artisan@meadowmist.in',
        name: 'Master Artisan',
        role: 'ADMIN',
      });

      vi.mocked(prisma.user.findUnique).mockResolvedValue({
        twoFactorEnabled: true,
      } as any);

      const res = await statusGet();
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.twoFactorEnabled).toBe(true);
    });
  });
});
