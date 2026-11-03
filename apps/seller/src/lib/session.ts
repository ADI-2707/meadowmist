import { cookies } from 'next/headers';
import {
  verifyToken,
  TokenPayload,
  ADMIN_COOKIE_NAME,
  TRUSTED_DEVICE_COOKIE_NAME,
  getSessionCookieOptions,
  getTrustedDeviceCookieOptions,
} from '@meadowmist/shared';

export { ADMIN_COOKIE_NAME };

export async function setAdminSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE_NAME, token, getSessionCookieOptions(true));
}

export async function setTrustedDeviceCookie(rawToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TRUSTED_DEVICE_COOKIE_NAME, rawToken, getTrustedDeviceCookieOptions());
}

export async function getTrustedDeviceToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TRUSTED_DEVICE_COOKIE_NAME)?.value || null;
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

export async function getAdminSessionUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}

export async function getSessionUser(): Promise<TokenPayload | null> {
  return getAdminSessionUser();
}
