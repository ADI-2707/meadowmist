import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, SESSION_COOKIE_NAME, checkEndpointRateLimit } from '@meadowmist/shared';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = request.headers?.get?.('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  if (
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/checkout') ||
    pathname.startsWith('/checkout')
  ) {
    const rateLimit = await checkEndpointRateLimit?.(`${ip}:${pathname.split('/')[2] || 'req'}`, 45, 60);
    if (rateLimit && !rateLimit.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimit.resetSeconds),
          },
        }
      );
    }
  }

  const requiresAuth =
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/account') ||
    pathname.startsWith('/api/account');

  if (requiresAuth) {
    const userToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (!userToken) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    const payload = await verifyToken(userToken);
    if (!payload) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/checkout/:path*', '/account/:path*', '/api/:path*'],
};
