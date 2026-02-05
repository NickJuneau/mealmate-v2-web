// app/api/history/route.ts
import { NextResponse } from 'next/server';
import { scanGmailForSwipes } from '@/app/lib/grubhub';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const days = Number(url.searchParams.get('days') ?? '30');
    const debug = url.searchParams.get('debug') === '1' || url.searchParams.get('debug') === 'true';
    // We want full recent events (ignoreWeek true here because history is recent)
    const res = await scanGmailForSwipes({ days, maxResults: 500, ignoreWeek: true, debug });
    // Return all events (recent)
    return NextResponse.json({
      weekStart: res.weekStart,
      usedRecent: res.usedRecent,
      events: res.events // array of SwipeEvent objects
    });
  } catch (err: any) {
    console.error('api/history error', err);
    return NextResponse.json({ error: err.message ?? 'server error' }, { status: 500 });
  }
}
