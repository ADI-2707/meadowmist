import crypto from 'crypto';

export const TRUSTED_DEVICE_COOKIE_NAME = 'mm_trusted_device';
export const TRUSTED_DEVICE_MAX_AGE = 60 * 60 * 24 * 60;

export function hashDeviceToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

export function generateDeviceToken(): { rawToken: string; tokenHash: string } {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashDeviceToken(rawToken);
  return { rawToken, tokenHash };
}

export function calculateDeviceExpiry(days: number = 60): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export function isDeviceExpired(expiresAt: Date | string | number): boolean {
  const expiryTime = new Date(expiresAt).getTime();
  return isNaN(expiryTime) || Date.now() > expiryTime;
}

