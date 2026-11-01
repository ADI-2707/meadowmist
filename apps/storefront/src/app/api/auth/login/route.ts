import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { comparePassword } from '@/lib/password';
import { signToken } from '@/lib/auth';
import { setSessionCookie } from '@/lib/session';
import {
  checkLoginAttempt,
  recordFailedAttempt,
  resetFailedAttempts,
} from '@meadowmist/shared';

function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || '127.0.0.1';
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const normalizedEmail = String(email).trim().toLowerCase();

    const check = checkLoginAttempt(ip, normalizedEmail);
    if (!check.allowed) {
      return NextResponse.json(
        {
          error: `Account temporarily locked due to repeated failed login attempts. Please try again in ${check.remainingSeconds} seconds.`,
          remainingSeconds: check.remainingSeconds,
          requireStepUp: check.requireStepUp,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(check.remainingSeconds),
          },
        }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user || !user.isActive) {
      const failure = recordFailedAttempt(ip, normalizedEmail);
      if (!failure.allowed) {
        return NextResponse.json(
          {
            error: `Account temporarily locked due to repeated failed login attempts. Please try again in ${failure.remainingSeconds} seconds.`,
            remainingSeconds: failure.remainingSeconds,
            requireStepUp: failure.requireStepUp,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(failure.remainingSeconds),
            },
          }
        );
      }
      return NextResponse.json(
        {
          error: 'Invalid email or password',
          requireStepUp: failure.requireStepUp,
        },
        { status: 401 }
      );
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      const failure = recordFailedAttempt(ip, normalizedEmail);
      if (!failure.allowed) {
        return NextResponse.json(
          {
            error: `Account temporarily locked due to repeated failed login attempts. Please try again in ${failure.remainingSeconds} seconds.`,
            remainingSeconds: failure.remainingSeconds,
            requireStepUp: failure.requireStepUp,
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(failure.remainingSeconds),
            },
          }
        );
      }
      return NextResponse.json(
        {
          error: 'Invalid email or password',
          requireStepUp: failure.requireStepUp,
        },
        { status: 401 }
      );
    }

    resetFailedAttempts(ip, normalizedEmail);

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setSessionCookie(token, false);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error during login' },
      { status: 500 }
    );
  }
}
