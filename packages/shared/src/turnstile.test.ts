import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { verifyTurnstileToken } from './turnstile';

describe('Cloudflare Turnstile Verification Engine', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('rejects empty, null, or whitespace-only tokens', async () => {
    expect((await verifyTurnstileToken('')).success).toBe(false);
    expect((await verifyTurnstileToken(null)).success).toBe(false);
    expect((await verifyTurnstileToken(undefined)).success).toBe(false);
    expect((await verifyTurnstileToken('   ')).success).toBe(false);
  });

  it('accepts dummy test pass tokens in test environment', async () => {
    const res1 = await verifyTurnstileToken('XXXX.DUMMY.PASS.TOKEN.XXXX');
    expect(res1.success).toBe(true);

    const res2 = await verifyTurnstileToken('pass');
    expect(res2.success).toBe(true);

    const res3 = await verifyTurnstileToken('1x00000000000000000000AA');
    expect(res3.success).toBe(true);
  });

  it('rejects dummy test fail tokens', async () => {
    const res1 = await verifyTurnstileToken('XXXX.DUMMY.FAIL.TOKEN.XXXX');
    expect(res1.success).toBe(false);
    expect(res1.errorCodes).toContain('invalid-input-response');

    const res2 = await verifyTurnstileToken('fail');
    expect(res2.success).toBe(false);
  });

  it('succeeds when Cloudflare siteverify API returns success', async () => {
    process.env.TURNSTILE_SECRET_KEY = '0x4AAAAAAAbcdef1234567890';

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        'error-codes': [],
        challenge_ts: '2026-11-01T12:00:00Z',
        hostname: 'meadowmist.in',
      }),
    });

    const res = await verifyTurnstileToken('valid_user_cf_token', '192.168.1.1');
    expect(res.success).toBe(true);
    expect(res.hostname).toBe('meadowmist.in');
  });

  it('rejects when Cloudflare siteverify API returns validation failure', async () => {
    process.env.TURNSTILE_SECRET_KEY = '0x4AAAAAAAbcdef1234567890';

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        'error-codes': ['invalid-input-response'],
      }),
    });

    const res = await verifyTurnstileToken('invalid_user_cf_token');
    expect(res.success).toBe(false);
    expect(res.errorCodes).toContain('invalid-input-response');
  });

  it('fails safely when fetch aborts or network throws', async () => {
    process.env.TURNSTILE_SECRET_KEY = '0x4AAAAAAAbcdef1234567890';

    global.fetch = vi.fn().mockRejectedValue(new Error('Network offline'));

    const res = await verifyTurnstileToken('live_token_with_offline_network');
    expect(res.success).toBe(false);
    expect(res.errorCodes).toContain('verification-network-error');
  });

  it('fails in production mode when secret key is missing', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.TURNSTILE_SECRET_KEY;

    const res = await verifyTurnstileToken('any_live_token');
    expect(res.success).toBe(false);
    expect(res.errorCodes).toContain('missing-secret-key');
  });
});

