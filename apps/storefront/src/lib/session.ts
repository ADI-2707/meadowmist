import { cookies } from 'next/headers';
import { verifyToken, TokenPayload } from './auth';
import { TRUSTED_DEVICE_COOKIE_NAME, TRUSTED_DEVICE_MAX_AGE } from '@meadowmist/shared';

export const SESSION_COOKIE_NAME = 'mm_session';
export const ADMIN_COOKIE_NAME = 'mm_admin_session';

export async function setSessionCookie(token: string, isAdmin: boolean = false): Promise<void> {
  const cookieStore = await cookies();
  const name = isAdmin ? ADMIN_COOKIE_NAME : SESSION_COOKIE_NAME;
  cookieStore.set(name, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * (isAdmin ? 7 : 14),
  });
}

export async function setTrustedDeviceCookie(rawToken: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(TRUSTED_DEVICE_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TRUSTED_DEVICE_MAX_AGE,
  });
}

export async function getTrustedDeviceToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(TRUSTED_DEVICE_COOKIE_NAME)?.value || null;
}

export async function clearSessionCookie(isAdmin: boolean = false): Promise<void> {
  const cookieStore = await cookies();
  const name = isAdmin ? ADMIN_COOKIE_NAME : SESSION_COOKIE_NAME;
  cookieStore.delete(name);
}

export async function getSessionUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function getAdminSessionUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}
