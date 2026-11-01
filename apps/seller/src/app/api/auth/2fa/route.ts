import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSessionUser } from '@/lib/session';

export async function GET() {
  try {
    const admin = await getAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: admin.userId },
      select: { twoFactorEnabled: true },
    });

    return NextResponse.json({
      twoFactorEnabled: user?.twoFactorEnabled ?? false,
    });
  } catch (error) {
    console.error('2FA status error:', error);
    return NextResponse.json(
      { error: 'Failed to get 2FA status' },
      { status: 500 }
    );
  }
}
