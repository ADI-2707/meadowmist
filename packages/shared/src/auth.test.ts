import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { signToken, verifyToken, TokenPayload } from './auth';

describe('Shared Auth Module', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  const mockPayload: TokenPayload = {
    userId: 'user_123',
    email: 'artisan@meadowmist.com',
    name: 'Meadow Artisan',
    role: 'ADMIN',
  };

  it('signs and verifies a valid token successfully', async () => {
    const token = await signToken(mockPayload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const verified = await verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(mockPayload.userId);
    expect(verified?.email).toBe(mockPayload.email);
    expect(verified?.name).toBe(mockPayload.name);
    expect(verified?.role).toBe(mockPayload.role);
  });

  it('supports custom expiration times', async () => {
    const token = await signToken(mockPayload, '2h');
    const verified = await verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(mockPayload.userId);
  });

  it('returns null for an expired token', async () => {
    const token = await signToken(mockPayload, '0s');
    await new Promise((resolve) => setTimeout(resolve, 50));
    const verified = await verifyToken(token);
    expect(verified).toBeNull();
  });

  it('returns null for malformed or corrupted tokens', async () => {
    expect(await verifyToken('invalid.jwt.token')).toBeNull();
    expect(await verifyToken('')).toBeNull();
    expect(await verifyToken('random_garbage_string')).toBeNull();
  });

  it('returns null when token signature is tampered', async () => {
    const token = await signToken(mockPayload);
    const parts = token.split('.');
    const tamperedPayload = Buffer.from(JSON.stringify({ ...mockPayload, role: 'SUPER_ADMIN' })).toString('base64url');
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    const verified = await verifyToken(tamperedToken);
    expect(verified).toBeNull();
  });

  it('throws an error in production environment when JWT_SECRET is missing', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;

    await expect(signToken(mockPayload)).rejects.toThrow(
      'FATAL: JWT_SECRET environment variable is required in production'
    );
  });

  it('succeeds in production environment when JWT_SECRET is explicitly configured', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'ultra-secure-test-key-for-production-verification-12345';

    const token = await signToken(mockPayload);
    expect(typeof token).toBe('string');
    const verified = await verifyToken(token);
    expect(verified?.userId).toBe(mockPayload.userId);
  });
});
