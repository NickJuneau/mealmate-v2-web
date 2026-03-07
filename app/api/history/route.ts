// app/api/history/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/app/lib/db';
import { getHistoryFromDb, maybeSyncSwipesForUser } from '@/app/lib/swipeStore';

const FORCE_SYNC_MIN_INTERVAL_MS = 60 * 1000;

function parseDays(value: string | null, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(180, Math.floor(parsed)));
}

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
    const days = parseDays(url.searchParams.get('days'), 30);
    const force =
      url.searchParams.get('force') === '1' ||
      url.searchParams.get('force') === 'true';
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

    if (force) {
      const ageMs = Date.now() - gmailRecord.updatedAt.getTime();
      if (ageMs < FORCE_SYNC_MIN_INTERVAL_MS) {
        const retryAfterSec = Math.ceil((FORCE_SYNC_MIN_INTERVAL_MS - ageMs) / 1000);
        return NextResponse.json(
          {
            error: `Please wait ${retryAfterSec}s before rescanning again.`,
            retryAfterSec
          },
          {
            status: 429,
            headers: { 'Retry-After': String(retryAfterSec) }
          }
        );
      }
    }

    const sync = await maybeSyncSwipesForUser({
      userId: user.id,
      token,
      gmailTokenUpdatedAt: gmailRecord.updatedAt,
      days,
      debug,
      force
    });

    const history = await getHistoryFromDb({
      userId: user.id,
      days,
      lastSyncedAt: sync.lastSyncedAt
    });
    return NextResponse.json(history);
  } catch (err: unknown) {
    console.error('api/history error', err);
    const msg = err instanceof Error ? err.message : 'server error';
    if (msg === 'invalid_grant') {
      return NextResponse.json(
        { error: 'Gmail credentials expired or revoked; please sign in again.' },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
