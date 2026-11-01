import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, ADMIN_COOKIE_NAME } from '@meadowmist/shared';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/api/health') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  if (pathname === '/login') {
    const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    if (adminToken) {
      const payload = await verifyToken(adminToken);
      if (payload && payload.role === 'ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    return NextResponse.next();
  }

  const adminToken = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!adminToken) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifyToken(adminToken);
  if (!payload || payload.role !== 'ADMIN') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
