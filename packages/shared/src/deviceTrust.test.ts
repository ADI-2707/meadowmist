import { describe, it, expect } from 'vitest';
import {
  generateDeviceToken,
  hashDeviceToken,
  calculateDeviceExpiry,
  isDeviceExpired,
  TRUSTED_DEVICE_COOKIE_NAME,
  TRUSTED_DEVICE_MAX_AGE,
} from './deviceTrust';

describe('Trusted Device Fingerprinting Engine', () => {
  it('exports valid cookie naming and expiration constants', () => {
    expect(TRUSTED_DEVICE_COOKIE_NAME).toBe('mm_trusted_device');
    expect(TRUSTED_DEVICE_MAX_AGE).toBe(5184000);
  });

  it('generates high-entropy raw token and matching SHA-256 hash', () => {
    const { rawToken, tokenHash } = generateDeviceToken();

    expect(typeof rawToken).toBe('string');
    expect(rawToken.length).toBe(64);
    expect(tokenHash).toBe(hashDeviceToken(rawToken));
  });

  it('generates unique tokens on subsequent invocations', () => {
    const device1 = generateDeviceToken();
    const device2 = generateDeviceToken();

    expect(device1.rawToken).not.toBe(device2.rawToken);
    expect(device1.tokenHash).not.toBe(device2.tokenHash);
  });

  it('computes deterministic SHA-256 hash for identical tokens', () => {
    const token = 'sample_secure_trusted_device_token_12345';
    const hash1 = hashDeviceToken(token);
    const hash2 = hashDeviceToken(token);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(64);
  });

  it('calculates correct expiration timestamp', () => {
    const now = Date.now();
    const expiry = calculateDeviceExpiry(30);

    const diffDays = Math.round((expiry.getTime() - now) / (1000 * 60 * 60 * 24));
    expect(diffDays).toBe(30);
  });

  it('evaluates active and expired timestamps accurately', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60);
    expect(isDeviceExpired(futureDate)).toBe(false);

    const pastDate = new Date(Date.now() - 1000 * 60);
    expect(isDeviceExpired(pastDate)).toBe(true);

    expect(isDeviceExpired('invalid-date')).toBe(true);
  });
});

