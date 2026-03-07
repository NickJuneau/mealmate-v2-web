// app/api/swipes/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/app/lib/db';
import { getSwipesSummaryFromDb, maybeSyncSwipesForUser } from '@/app/lib/swipeStore';

const FORCE_SYNC_MIN_INTERVAL_MS = 60 * 1000;

function parseDays(value: unknown, fallback: number) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(90, Math.floor(parsed)));
}

async function getAuthContext() {
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
      error: NextResponse.json({ error: 'user not found' }, { status: 401 })
    };
  }

  const gmailRecord = await prisma.gmailToken.findUnique({
    where: { userId: user.id }
  });
  if (!gmailRecord || !gmailRecord.refreshToken) {
    return {
      error: NextResponse.json(
        { error: 'no gmail credentials, please re-authenticate' },
        { status: 401 }
      )
    };
  }

  return { user, gmailRecord };
}

function toToken(gmailRecord: {
  accessToken: string | null;
  refreshToken: string | null;
  scope: string | null;
  tokenType: string | null;
  expiry: Date | null;
}) {
  return {
    access_token: gmailRecord.accessToken ?? undefined,
    refresh_token: gmailRecord.refreshToken ?? undefined,
    scope: gmailRecord.scope ?? undefined,
    token_type: gmailRecord.tokenType ?? undefined,
    expiry_date: gmailRecord.expiry ? gmailRecord.expiry.getTime() : undefined
  };
}

export async function GET(req: Request) {
  try {
    const auth = await getAuthContext();
    if ('error' in auth) return auth.error;

    const { user, gmailRecord } = auth;
    const url = new URL(req.url);
    const days = parseDays(url.searchParams.get('days'), 7);
    const debug =
      url.searchParams.get('debug') === '1' ||
      url.searchParams.get('debug') === 'true';

    const sync = await maybeSyncSwipesForUser({
      userId: user.id,
      token: toToken(gmailRecord),
      gmailTokenUpdatedAt: gmailRecord.updatedAt,
      days,
      debug,
      force: false
    });

    const summary = await getSwipesSummaryFromDb({
      userId: user.id,
      days,
      previewLimit: 12,
      lastSyncedAt: sync.lastSyncedAt
    });
    return NextResponse.json(summary);
  } catch (err: unknown) {
    console.error('api/swipes GET error', err);
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

export async function POST(req: Request) {
  try {
    const auth = await getAuthContext();
    if ('error' in auth) return auth.error;

    const { user, gmailRecord } = auth;
    const url = new URL(req.url);
    const debug =
      url.searchParams.get('debug') === '1' ||
      url.searchParams.get('debug') === 'true';

    let days = parseDays(url.searchParams.get('days'), 7);
    try {
      const body = (await req.json()) as { days?: number } | null;
      if (body && typeof body.days !== 'undefined') {
        days = parseDays(body.days, days);
      }
    } catch {
      // body is optional
    }

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

    const sync = await maybeSyncSwipesForUser({
      userId: user.id,
      token: toToken(gmailRecord),
      gmailTokenUpdatedAt: gmailRecord.updatedAt,
      days,
      debug,
      force: true
    });

    const summary = await getSwipesSummaryFromDb({
      userId: user.id,
      days,
      previewLimit: 12,
      lastSyncedAt: sync.lastSyncedAt
    });
    return NextResponse.json(summary);
  } catch (err: unknown) {
    console.error('api/swipes POST error', err);
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

