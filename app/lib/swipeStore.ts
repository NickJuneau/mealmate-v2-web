import { prisma } from '@/app/lib/db';
import {
  scanGmailForSwipes,
  type GmailOAuthToken,
  type SwipeEvent as ParsedSwipeEvent
} from '@/app/lib/grubhub';
import { getSwipeWeekWindow } from '@/app/lib/time';

const SYNC_COOLDOWN_MS = 30 * 60 * 1000; // avoid repeated scans for empty-result users

function isSyncStale(lastSyncAt: Date) {
  return Date.now() - lastSyncAt.getTime() >= SYNC_COOLDOWN_MS;
}

function toClientEvent(e: {
  messageId: string;
  orderId: string | null;
  occurredAt: Date;
  meals: number;
  store: string | null;
  items: unknown;
}) {
  return {
    messageId: e.messageId,
    orderId: e.orderId,
    occurredAt: e.occurredAt.toISOString(),
    meals: e.meals,
    store: e.store,
    items: Array.isArray(e.items) ? e.items.map(String) : undefined
  };
}

function toCreateManyEvent(userId: string, e: ParsedSwipeEvent) {
  return {
    userId,
    messageId: e.messageId,
    orderId: e.orderId ?? null,
    occurredAt: new Date(e.occurredAt),
    meals: e.meals,
    store: e.store ?? null,
    items: e.items ?? undefined,
    rawSnippet: e.rawSnippet ?? null
  };
}

export async function syncAndPersistSwipesForUser({
  userId,
  token,
  days,
  maxResults = 500,
  debug = false
}: {
  userId: string;
  token: GmailOAuthToken;
  days: number;
  maxResults?: number;
  debug?: boolean;
}) {
  const scan = await scanGmailForSwipes({
    days,
    maxResults,
    ignoreWeek: true,
    debug,
    token
  });

  if (scan.events.length > 0) {
    await prisma.swipeEvent.createMany({
      data: scan.events.map((e) => toCreateManyEvent(userId, e)),
      skipDuplicates: true
    });
  }

  // touch sync timestamp using existing gmail_tokens.updatedAt
  const updatedToken = await prisma.gmailToken.update({
    where: { userId },
    data: { updatedAt: new Date() },
    select: { updatedAt: true }
  });

  // Keep storage bounded.
  await prisma.swipeEvent.deleteMany({
    where: {
      userId,
      occurredAt: { lt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000) }
    }
  });

  return { lastSyncedAt: updatedToken.updatedAt };
}

export async function maybeSyncSwipesForUser({
  userId,
  token,
  gmailTokenUpdatedAt,
  days,
  force = false,
  debug = false
}: {
  userId: string;
  token: GmailOAuthToken;
  gmailTokenUpdatedAt: Date;
  days: number;
  force?: boolean;
  debug?: boolean;
}) {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [hasAny, hasRecent] = await prisma.$transaction([
    prisma.swipeEvent.findFirst({
      where: { userId },
      select: { id: true }
    }),
    prisma.swipeEvent.findFirst({
      where: { userId, occurredAt: { gte: cutoff } },
      select: { id: true }
    })
  ]);

  if (force || !hasAny || (!hasRecent && isSyncStale(gmailTokenUpdatedAt))) {
    const res = await syncAndPersistSwipesForUser({
      userId,
      token,
      days: Math.max(days, 30),
      maxResults: 500,
      debug
    });
    return { didSync: true, lastSyncedAt: res.lastSyncedAt };
  }

  return { didSync: false, lastSyncedAt: gmailTokenUpdatedAt };
}

export async function getSwipesSummaryFromDb({
  userId,
  days,
  previewLimit = 12,
  lastSyncedAt
}: {
  userId: string;
  days: number;
  previewLimit?: number;
  lastSyncedAt?: Date;
}) {
  const { weekStart, weekEnd } = getSwipeWeekWindow();
  const recentCutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [weeklyAgg, previewRows, recentAgg, recentCount] = await prisma.$transaction([
    prisma.swipeEvent.aggregate({
      where: {
        userId,
        occurredAt: { gte: weekStart, lt: weekEnd }
      },
      _sum: { meals: true }
    }),
    prisma.swipeEvent.findMany({
      where: {
        userId,
        occurredAt: { gte: weekStart, lt: weekEnd }
      },
      orderBy: { occurredAt: 'desc' },
      take: previewLimit,
      select: {
        messageId: true,
        orderId: true,
        occurredAt: true,
        meals: true,
        store: true,
        items: true
      }
    }),
    prisma.swipeEvent.aggregate({
      where: {
        userId,
        occurredAt: { gte: recentCutoff }
      },
      _sum: { meals: true }
    }),
    prisma.swipeEvent.count({
      where: {
        userId,
        occurredAt: { gte: recentCutoff }
      }
    })
  ]);

  const used = weeklyAgg._sum.meals ?? 0;
  return {
    weekStart: weekStart.toISOString(),
    used,
    remaining: Math.max(0, 7 - used),
    preview: previewRows.map(toClientEvent),
    meta: {
      usedRecent: recentAgg._sum.meals ?? 0,
      totalFoundRecent: recentCount,
      lastSyncedAt: lastSyncedAt ? lastSyncedAt.toISOString() : null
    }
  };
}

export async function getHistoryFromDb({
  userId,
  days,
  lastSyncedAt
}: {
  userId: string;
  days: number;
  lastSyncedAt?: Date;
}) {
  const recentCutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const [events, agg] = await prisma.$transaction([
    prisma.swipeEvent.findMany({
      where: {
        userId,
        occurredAt: { gte: recentCutoff }
      },
      orderBy: { occurredAt: 'desc' },
      select: {
        messageId: true,
        orderId: true,
        occurredAt: true,
        meals: true,
        store: true,
        items: true
      }
    }),
    prisma.swipeEvent.aggregate({
      where: {
        userId,
        occurredAt: { gte: recentCutoff }
      },
      _sum: { meals: true }
    })
  ]);

  return {
    weekStart: getSwipeWeekWindow().weekStart.toISOString(),
    usedRecent: agg._sum.meals ?? 0,
    lastSyncedAt: lastSyncedAt ? lastSyncedAt.toISOString() : null,
    events: events.map(toClientEvent)
  };
}
