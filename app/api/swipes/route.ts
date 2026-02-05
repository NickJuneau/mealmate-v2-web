// app/api/swipes/route.ts
import { NextResponse } from 'next/server';
import { scanGmailForSwipes } from "@/app/lib/grubhub"

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const days = Number(url.searchParams.get('days') ?? '7');
    const ignoreWeek = url.searchParams.get('ignoreWeek') === '1' || url.searchParams.get('ignoreWeek') === 'true';
    const debug = url.searchParams.get('debug') === '1' || url.searchParams.get('debug') === 'true';
    const res = await scanGmailForSwipes({ days, maxResults: 250, ignoreWeek, debug });
    // Shape response for UI
    const used = res.used; // already respects ignoreWeek
    return NextResponse.json({
      weekStart: res.weekStart,
      used,
      remaining: Math.max(0, 7 - used),
      preview: res.events.slice(0, 12),
      meta: { usedRecent: res.usedRecent, totalFoundRecent: res.totalFoundRecent }
    });
  } catch (err: any) {
    console.error('api/swipes error', err);
    return NextResponse.json({ error: err.message ?? 'server error' }, { status: 500 });
  }
}
