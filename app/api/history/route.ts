// app/api/history/route.ts
import { NextResponse } from 'next/server';
import { scanGmailForSwipes } from '@/app/lib/grubhub';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/app/lib/db';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'not authenticated' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    if (!user) {
      return NextResponse.json({ error: 'user not found' }, { status: 401 });
    }

    const gmailRecord = await prisma.gmailToken.findUnique({
      where: { userId: user.id }
    });
    if (!gmailRecord || !gmailRecord.refreshToken) {
      return NextResponse.json(
        { error: 'no gmail credentials, please re‑authenticate' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const days = Number(url.searchParams.get('days') ?? '30');
    const debug =
      url.searchParams.get('debug') === '1' ||
      url.searchParams.get('debug') === 'true';

    const token = {
      access_token: gmailRecord.accessToken ?? undefined,
      refresh_token: gmailRecord.refreshToken,
      scope: gmailRecord.scope ?? undefined,
      token_type: gmailRecord.tokenType ?? undefined,
      expiry_date: gmailRecord.expiry ? gmailRecord.expiry.getTime() : undefined
    };

    // We want full recent events (ignoreWeek true here because history is recent)
    const res = await scanGmailForSwipes({
      days,
      maxResults: 500,
      ignoreWeek: true,
      debug,
      token
    });
    // Return all events (recent)
    return NextResponse.json({
      weekStart: res.weekStart,
      usedRecent: res.usedRecent,
      events: res.events // array of SwipeEvent objects
    });
  } catch (err: any) {
    console.error('api/history error', err);
    const msg = err?.message ?? 'server error';
    if (msg === 'invalid_grant') {
      return NextResponse.json(
        { error: 'Gmail credentials expired or revoked; please sign in again.' },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
