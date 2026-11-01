import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSessionUser } from '@/lib/session';
import { generateTotpSecret, generateTotpUri } from '@meadowmist/shared';

export async function POST() {
  try {
    const admin = await getAdminSessionUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const secret = generateTotpSecret();
    const qrUri = generateTotpUri(secret, admin.email, 'Meadow Mist');

    await prisma.user.update({
      where: { id: admin.userId },
      data: { twoFactorSecret: secret },
    });

    return NextResponse.json({ secret, qrUri });
  } catch (error) {
    console.error('2FA setup error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate 2FA setup' },
      { status: 500 }
    );
  }
}

