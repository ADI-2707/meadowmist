import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSessionUser } from '@/lib/session';
import { verifyTotpCode } from '@meadowmist/shared';

export async function POST(request: Request) {
  try {
    const admin = await getAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { totpCode } = body;

    if (!totpCode || typeof totpCode !== 'string') {
      return NextResponse.json(
        { error: 'Verification code is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: admin.userId },
    });

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json(
        { error: '2FA setup has not been initiated' },
        { status: 400 }
      );
    }

    const isValid = verifyTotpCode(user.twoFactorSecret, totpCode);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: admin.userId },
      data: { twoFactorEnabled: true },
    });

    return NextResponse.json({
      success: true,
      message: 'Two-factor authentication enabled successfully',
    });
  } catch (error) {
    console.error('2FA enable error:', error);
    return NextResponse.json(
      { error: 'Failed to enable 2FA' },
      { status: 500 }
    );
  }
}
