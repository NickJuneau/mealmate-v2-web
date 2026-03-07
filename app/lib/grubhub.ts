// lib/grubhub.ts
// Server-side module for Next.js (App Router).
// Dev-mode: expects credentials.json + token.json in project root.
// Usage: import { scanGmailForSwipes } from '@/lib/grubhub';
// then call `await scanGmailForSwipes({ days: 7, maxResults: 250, ignoreWeek: false, debug: false })`

// NOTE: CREATED BY chatgpt.com

import fs from 'fs/promises';
import path from 'path';
import { google } from 'googleapis';

export type SwipeEvent = {
  messageId: string;
  orderId?: string | null;
  occurredAt: string; // ISO
  meals: number;
  store?: string | null;
  items?: string[]; // parsed items if available
  rawSnippet?: string;
  subject?: string;
  from?: string;
  inWeek?: boolean;
};

export type ScanResult = {
  weekStart: string; // ISO
  used: number; // used in week (unless ignoreWeek true)
  usedRecent: number; // total found in days window
  events: SwipeEvent[]; // events included (filtered to week unless ignoreWeek)
  totalFoundRecent: number; // number of matched messages in window (distinct)
};

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

// build a Gmail client, refreshing the access token if necessary.
// Optionally accepts a token object; if none is provided it will fall back to
// loading `token.json` from the project root (dev mode only).
async function makeGmailClient(
  opts: { token?: any; debug?: boolean } = {}
) {
  const { token: providedToken, debug = false } = opts;

  const creds = await loadJsonFromRoot<any>('credentials.json');
  const token = providedToken ?? (await loadJsonFromRoot<any>('token.json'));

  const clientId = (creds.installed ?? creds.web)?.client_id;
  const clientSecret = (creds.installed ?? creds.web)?.client_secret;
  if (!clientId || !clientSecret) throw new Error('Invalid credentials.json');

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oAuth2Client.setCredentials(token);

  // ensure the access token is current. `getAccessToken` will automatically
  // perform a refresh using the stored `refresh_token` if necessary. An
  // `invalid_grant` response means the refresh token was revoked or expired, and
  // the caller should re‑authorize; we bubble that up as a specific error.
  try {
    if (debug) console.log('[grubhub] checking access token');
    await oAuth2Client.getAccessToken();
  } catch (err: any) {
    const errBody = err?.response?.data || err;
    if (errBody && errBody.error === 'invalid_grant') {
      throw new Error('invalid_grant');
    }
    throw err;
  }

  return google.gmail({ version: 'v1', auth: oAuth2Client });
}

// Helper: read credentials/token from project root (DEV ONLY)
async function loadJsonFromRoot<T = any>(name: string): Promise<T> {
  const p = path.resolve(process.cwd(), name);
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw) as T;
  } catch (err: any) {
    throw new Error(`Failed to load ${name} from project root (${p}): ${err?.message ?? err}`);
  }
}

// Helper: write token back to disk (DEV ONLY)
async function saveJsonToRoot<T = any>(name: string, data: T): Promise<void> {
  const p = path.resolve(process.cwd(), name);
  try {
    await fs.writeFile(p, JSON.stringify(data, null, 2), 'utf8');
  } catch (err: any) {
    throw new Error(`Failed to save ${name} to project root (${p}): ${err?.message ?? err}`);
  }
}

function swipeWeekStart(date = new Date()) {
  const d = new Date(date.getTime());
  const day = d.getDay(); // 0=Sun ... 4=Thu
  const daysBack = ((day - 4 + 7) % 7);
  const start = new Date(d.getTime());
  start.setDate(d.getDate() - daysBack);
  start.setHours(0, 0, 0, 0);
  start.setMilliseconds(0);
  return start;
}
function weekEndFromStartMs(startMs: number) {
  return startMs + 7 * 24 * 60 * 60 * 1000;
}

// Gmail decoding helper
function decodeBase64UrlSafe(b64?: string) {
  if (!b64) return '';
  b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return Buffer.from(b64, 'base64').toString('utf8');
}

function extractHeader(headers: any[] | undefined, name: string) {
  if (!headers) return null;
  const h = headers.find(h => h.name && h.name.toLowerCase() === name.toLowerCase());
  return h ? h.value : null;
}

/* ---------- Parser: attempts to extract meals, order, store, items ---------- */
export function parseMessageForOrderAndMeals(msg: any) {
  let body = '';

  function gatherParts(part: any) {
    if (!part) return;
    if (Array.isArray(part.parts) && part.parts.length) {
      for (const p of part.parts) gatherParts(p);
    }
    if (part.body && part.body.data) {
      body += decodeBase64UrlSafe(part.body.data);
    }
  }

  if (msg.payload) gatherParts(msg.payload);
  else if (msg.raw) body = decodeBase64UrlSafe(msg.raw);

  body = (body || (msg.snippet || '') || '').replace(/\s+/g, ' ').trim();
  // URLs in promo emails often contain noisy alphanumeric tokens that can
  // accidentally match compact meal patterns (e.g. "8M"). Strip them first.
  const bodyNoUrls = body
    .replace(/\bhttps?:\/\/\S+/gi, ' ')
    .replace(/\bwww\.\S+/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 1) Meals explicit variants
  const mealsMatch =
    bodyNoUrls.match(/Meals\s*Used\s*[:\-\s]?\s*(\d+)/i) ||
    bodyNoUrls.match(/Meal\s*Swipe\s*Used\s*[:\-\s]?\s*(\d+)/i) ||
    bodyNoUrls.match(/\bMeals\s*[:\-\s]?\s*(\d+)/i);

  let meals: number | null = mealsMatch ? Number(mealsMatch[1]) : null;

  // 2) compact receipt form like "Total: 1M + $0.30"
  if (!meals) {
    const mShort =
      bodyNoUrls.match(/\bTotal\s*:\s*(\d+)\s*M\b/i) ||
      bodyNoUrls.match(/\b(\d+)\s*M\s*\+\s*\$\d/i);
    if (mShort) meals = Number(mShort[1]);
  }

  // 3) Paid Using: Meal / Meal + Meal Plan Dollars
  if (!meals) {
    const paidMatch = bodyNoUrls.match(/Paid\s+Using\s*:\s*([^<\n\r]+)/i);
    if (paidMatch) {
      const paidText = paidMatch[1];
      if (/\bmeal\b/i.test(paidText) || /\bmeal\s*swipe\b/i.test(paidText)) {
        const explicitNum = paidText.match(/(\d+)\s*(?:meal|meals|M)/i);
        meals = explicitNum ? Number(explicitNum[1]) : 1;
      }
    }
  }

  // 4) Fallback: presence of Meal Value suggests a swipe used
  if (!meals) {
    if (/Meal\s*Value/i.test(bodyNoUrls)) meals = 1;
  }

  // Order number
  const orderMatch =
    bodyNoUrls.match(/\bOrder\s*(?:#|number|No\.?)\s*[:#]?\s*(\d{6,})\b/i) ||
    bodyNoUrls.match(/\bOrder\s*#\s*(\d{6,})\b/i);
  const orderId = orderMatch ? orderMatch[1] : null;

  // Try to extract store: common lines include "Shop: X" or first bold heading, or "Pickup from X"
  let store: string | null = null;
  const shopMatch = bodyNoUrls.match(/Shop\s*[:\-]\s*([A-Za-z0-9 &'\-]+)/i);
  if (shopMatch) store = shopMatch[1].trim();
  if (!store) {
    const pickupMatch = bodyNoUrls.match(/Pickup\s*(?:from)?\s*[:\-]?\s*([A-Za-z0-9 &'\-]+)/i);
    if (pickupMatch) store = pickupMatch[1].trim();
  }
  if (!store) {
    // some receipts include the vendor at the top like "Qdoba Pickup"
    const topVendor = bodyNoUrls.match(/^([A-Z][a-zA-Z '&-]{2,40})\b/);
    if (topVendor) {
      const candidate = topVendor[1].trim();
      if (!/^(order|your|up)\b/i.test(candidate)) store = candidate;
    }
  }

  // Try to parse items: look for lines like "1 x Grilled Adobo Chicken Bowl" or "1x Item"
  const items: string[] = [];
  const itemLineRegex = /(?:\b\d+x?\s*)?([A-Z0-9][A-Za-z0-9'&\-\s]{3,60})\s*\$?\d{0,3}\.?\d{0,2}/g;
  let match: RegExpExecArray | null;
  // Run limited number of matches to avoid spam
  let found = 0;
  while ((match = itemLineRegex.exec(bodyNoUrls)) && found < 8) {
    const candidate = match[1].trim();
    // ignore common words that are not items
    if (/subtotal|tax|tip|meal value|order approved|paid using|locker|pickup/i.test(candidate)) {
      // skip
    } else {
      // avoid capturing long store names as items
      if (candidate.length > 2 && candidate.length < 80) {
        items.push(candidate);
        found++;
      }
    }
  }

  // If items empty, try a different pattern for "ITEMS: 1 x ..."
  if (!items.length) {
    const itemsBlock = bodyNoUrls.match(/ITEMS\s*[:\-]\s*(.+?)\s*(?:Subtotal|Service fee|Total|PAYMENT)/i);
    if (itemsBlock) {
      const rawItems = itemsBlock[1].split(/\+|\n|;|,/).map(s => s.trim()).filter(Boolean);
      for (const it of rawItems) {
        if (it.length > 2 && items.length < 8) items.push(it.replace(/\s{2,}/g, ' '));
      }
    }
  }

  // final fallback: snippet
  const rawSnippet = bodyNoUrls.slice(0, 1200);

  return { meals: meals ?? null, orderId, store: store ?? null, items, rawSnippet };
}

/* ---------- Main scan function exported for server usage ---------- */
export async function scanGmailForSwipes({
  days = 7,
  maxResults = 250,
  ignoreWeek = false,
  debug = false,
  token // optional OAuth2 token object
}: {
  days?: number;
  maxResults?: number;
  ignoreWeek?: boolean;
  debug?: boolean;
  token?: any;
} = {}): Promise<ScanResult> {
  // build/refresh gmail client; will throw 'invalid_grant' if the stored tokens
  // are no longer usable and the user must re‑authorize.
  let gmail;
  try {
    gmail = await makeGmailClient({ debug, token });
  } catch (err: any) {
    // propagate more specific errors so callers can react (e.g. signal 401)
    if (err.message === 'invalid_grant') {
      const e = new Error('invalid_grant');
      // keep original stack for debugging
      throw e;
    }
    throw err;
  }

  const now = Date.now();
  const weekStart = swipeWeekStart(new Date());
  const weekStartMs = weekStart.getTime();
  const weekEndMs = weekEndFromStartMs(weekStartMs);

  // build query: match known senders and keywords, limit to recent days
  const senderParts = '(from:(grubhub OR tapingo-grubhub OR "no-reply@tapingo" OR "no-reply@grubhub") OR subject:(\"Order approved\" OR \"Order Receipt\" OR \"Order confirmed\") OR "Meals Used" OR "Paid Using")';
  const datePart = `newer_than:${days}d`;
  const query = `${senderParts} ${datePart}`;

  if (debug) console.log('[grubhub] Gmail query:', query);

  const listRes = await gmail.users.messages.list({ userId: 'me', q: query, maxResults });
  const messages = listRes.data.messages || [];

  if (debug) console.log(`[grubhub] found ${messages.length} messages`);

  const events: SwipeEvent[] = [];
  const seen = new Set<string>();

  for (const m of messages) {
    // Guard: ensure message id exists and is a string
    if (!m?.id) {
      if (debug) console.warn('[grubhub] skipping message without id', m);
      continue;
    }
    const msgId = String(m.id);

    try {
      const getRes = await gmail.users.messages.get({ userId: 'me', id: msgId, format: 'full' });
      const msg = getRes.data;
      const internalDateMs = Number(msg.internalDate || Date.now());
      if (isNaN(internalDateMs)) continue;

      // enforce days window
      if (internalDateMs < now - days * 24 * 3600 * 1000) continue;

      const headers = msg.payload?.headers || [];
      const subject = extractHeader(headers, 'Subject') || '';
      const from = extractHeader(headers, 'From') || '';

      const parsed = parseMessageForOrderAndMeals(msg);
      const meals = parsed.meals ?? 0;
      const orderId = parsed.orderId ?? null;
      const orderKey = orderId ?? msgId;

      const looksLikeGrubhub = /grubhub|tapingo/i.test(String(from)) || /grubhub/i.test(subject) || /grubhub/i.test(msg.snippet || '');

      const receiptBySubject = /\border\s*receipt\b|\border\s*approved\b|\border\s*confirmed\b/i.test(subject);
      const receiptByBody =
        /\bPaid\s+Using\s*:|\bTotal\s*:\s*\d+\s*M\b|\bOrder\s*#\s*\d{6,}\b/i.test(parsed.rawSnippet || '');
      const promoBySubject = /\b(reminder|last call|% off|deal|grocery|groceries)\b/i.test(subject);
      const seemsReceipt = receiptBySubject || receiptByBody;

      if (meals && meals > 0 && looksLikeGrubhub && seemsReceipt && !promoBySubject) {
        // dedupe by messageId or orderId
        const dedupeKey = `${orderKey}`;
        if (!seen.has(dedupeKey)) {
          seen.add(dedupeKey);
          const inWeek = internalDateMs >= weekStartMs && internalDateMs < weekEndMs;
          events.push({
            messageId: String(msg.id),
            orderId,
            occurredAt: new Date(internalDateMs).toISOString(),
            meals,
            store: parsed.store ?? null,
            items: parsed.items && parsed.items.length ? parsed.items : undefined,
            rawSnippet: parsed.rawSnippet,
            subject,
            from,
            inWeek
          });
        }
      } else {
        if (debug) {
          console.log('--- debug: inspected message ---');
          console.log('id:', msg.id);
          console.log('from:', from);
          console.log('subject:', subject);
          console.log('internalDate:', new Date(internalDateMs).toString());
          console.log('parsed meals:', parsed.meals);
          console.log('parsed orderId:', parsed.orderId);
          console.log('snippet:', parsed.rawSnippet?.slice(0, 300));
          console.log('--------------------------------');
        }
      }
    } catch (err: any) {
      if (debug) console.error('[grubhub] msg fetch error', msgId, err?.message ?? err);
      continue;
    }
  }

  // compute totals
  const usedRecent = events.reduce((s, e) => s + e.meals, 0);
  const usedInWeek = events.filter(e => e.inWeek).reduce((s, e) => s + e.meals, 0);

  const used = ignoreWeek ? usedRecent : usedInWeek;
  const filteredEvents = ignoreWeek ? events : events.filter(e => e.inWeek);

  return {
    weekStart: weekStart.toISOString(),
    used,
    usedRecent,
    events: filteredEvents,
    totalFoundRecent: events.length
  };
}
