import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { google } from 'googleapis';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/app/lib/db';

function getErrorMessage(err: unknown) {
  if (err instanceof Error && err.message) return err.message;
  return 'server error';
}

async function getAuthedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return {
      error: NextResponse.json({ error: 'not authenticated' }, { status: 401 })
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email }
  });
  if (!user) {
    return {
      error: NextResponse.json({ error: 'user not found' }, { status: 404 })
    };
  }

  return { user };
}

async function revokeGoogleToken(token?: string | null) {
  if (!token) return;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return;

  try {
    const oauth2 = new google.auth.OAuth2(clientId, clientSecret);
    await oauth2.revokeToken(token);
  } catch (err) {
    // Revocation failure should not block local data deletion.
    console.warn('google token revoke failed', err);
  }
}

export async function POST() {
  try {
    const authed = await getAuthedUser();
    if ('error' in authed) return authed.error;
    const { user } = authed;

    const gmailToken = await prisma.gmailToken.findUnique({
      where: { userId: user.id },
      select: { accessToken: true, refreshToken: true }
    });

    await Promise.all([
      revokeGoogleToken(gmailToken?.refreshToken),
      revokeGoogleToken(gmailToken?.accessToken)
    ]);

    await prisma.$transaction([
      prisma.swipeEvent.deleteMany({ where: { userId: user.id } }),
      prisma.gmailToken.deleteMany({ where: { userId: user.id } }),
      prisma.account.updateMany({
        where: { userId: user.id, provider: 'google' },
        data: { refresh_token: null, access_token: null }
      })
    ]);

    return NextResponse.json({
      ok: true,
      message: 'Disconnected Gmail and removed stored swipe data.'
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const authed = await getAuthedUser();
    if ('error' in authed) return authed.error;
    const { user } = authed;

    const gmailToken = await prisma.gmailToken.findUnique({
      where: { userId: user.id },
      select: { accessToken: true, refreshToken: true }
    });

    await Promise.all([
      revokeGoogleToken(gmailToken?.refreshToken),
      revokeGoogleToken(gmailToken?.accessToken)
    ]);

    await prisma.user.delete({ where: { id: user.id } });

    return NextResponse.json({
      ok: true,
      message: 'Your account and associated data were deleted.'
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

