import { describe, it, expect } from 'vitest';
import {
  generateTotpSecret,
  generateTotpToken,
  verifyTotpCode,
  generateTotpUri,
} from './totp';

describe('RFC 6238 TOTP Engine', () => {
  it('generates valid Base32 secret string', () => {
    const secret = generateTotpSecret(20);
    expect(typeof secret).toBe('string');
    expect(secret.length).toBeGreaterThanOrEqual(16);
    expect(/^[A-Z2-7]+$/.test(secret)).toBe(true);
  });

  it('generates 6-digit numeric token', () => {
    const secret = generateTotpSecret();
    const token = generateTotpToken(secret);
    expect(token).toMatch(/^\d{6}$/);
  });

  it('successfully verifies code generated at same timestamp', () => {
    const secret = generateTotpSecret();
    const now = Date.now();
    const code = generateTotpToken(secret, now);

    expect(verifyTotpCode(secret, code, now)).toBe(true);
  });

  it('tolerates 30-second clock drift backward and forward', () => {
    const secret = generateTotpSecret();
    const now = Date.now();

    const pastCode = generateTotpToken(secret, now - 30 * 1000);
    expect(verifyTotpCode(secret, pastCode, now, 1)).toBe(true);

    const futureCode = generateTotpToken(secret, now + 30 * 1000);
    expect(verifyTotpCode(secret, futureCode, now, 1)).toBe(true);
  });

  it('rejects code outside drift window', () => {
    const secret = generateTotpSecret();
    const now = Date.now();

    const farPastCode = generateTotpToken(secret, now - 90 * 1000);
    expect(verifyTotpCode(secret, farPastCode, now, 1)).toBe(false);
  });

  it('rejects malformed, non-numeric, or incorrect codes', () => {
    const secret = generateTotpSecret();
    expect(verifyTotpCode(secret, '12345')).toBe(false);
    expect(verifyTotpCode(secret, '1234567')).toBe(false);
    expect(verifyTotpCode(secret, 'abcdef')).toBe(false);
    expect(verifyTotpCode(secret, '000000')).toBe(false);
    expect(verifyTotpCode('', '123456')).toBe(false);
  });

  it('generates well-formed otpauth URI for authenticator QR codes', () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const uri = generateTotpUri(secret, 'admin@meadowmist.in');

    expect(uri).toContain('otpauth://totp/Meadow%20Mist:admin%40meadowmist.in');
    expect(uri).toContain('secret=JBSWY3DPEHPK3PXP');
    expect(uri).toContain('issuer=Meadow%20Mist');
    expect(uri).toContain('period=30');
  });
});

