import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSessionUser } from '@/lib/session';
import { comparePassword } from '@/lib/password';

export async function POST(request: Request) {
  try {
    const admin = await getAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'Password confirmation is required to disable 2FA' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: admin.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: admin.userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication disabled',
    });
  } catch (error) {
    console.error('2FA disable error:', error);
    return NextResponse.json(
      { error: 'Failed to disable 2FA' },
      { status: 500 }
    );
  }
}
