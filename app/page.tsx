// app/page.tsx (client)
'use client';
import { useEffect, useState } from 'react';
import { useSwipes, useRescan } from '@/app/lib/hooks/useSwipes';

type ScanMessage = { type: 'info' | 'success' | 'error'; text: string } | null;

export default function HomePage() {
  const [days] = useState<number>(7); // fixed to 7 days per your design
  const { data, isLoading, error } = useSwipes(days);
  const rescan = useRescan();

  // React Query v5 mutation status is 'pending' | 'success' | 'error' | 'idle'
  const isRescanning = rescan.status === 'pending';

  // transient status message state
  const [scanMessage, setScanMessage] = useState<ScanMessage>(null);

  useEffect(() => {
    // show "Rescanning…" while mutation is pending
    if (rescan.status === 'pending') {
      setScanMessage({ type: 'info', text: 'Rescanning…' });
      return; // don't set timeout for pending; wait for result
    }

    // on success or error, show message and auto-clear after 5s
    if (rescan.status === 'success') {
      setScanMessage({ type: 'success', text: 'Rescan complete' });
      const t = setTimeout(() => setScanMessage(null), 5000);
      return () => clearTimeout(t);
    }

    if (rescan.status === 'error') {
      setScanMessage({
        type: 'error',
        text: (rescan.error as Error)?.message ?? 'Rescan failed'
      });
      const t = setTimeout(() => setScanMessage(null), 5000);
      return () => clearTimeout(t);
    }

    // if status is idle, we don't show anything (or we keep whatever message is present)
    // no-op for 'idle'
    return;
  }, [rescan.status, rescan.error]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        {/* subtle top area / hero card */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-md bg-black text-white flex items-center justify-center font-semibold">
              M
            </div>
            <div>
              <div className="text-sm text-gray-600">MealMate v2</div>
              <div className="text-xs text-gray-400">Swipe tracker</div>
            </div>
          </div>

          {/* small nav already exists — keep minimal */}
        </div>

        {/* centered card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* top row: big counter + actions */}
          <div className="md:flex md:items-center md:justify-between gap-6">
            <div>
              <div className="text-sm text-gray-500">This week</div>

              <div className="mt-2 flex items-center gap-4">
                <div className="text-5xl sm:text-6xl font-extrabold leading-none">
                  {data ? data.used : '—'}{' '}
                  <span className="text-2xl font-medium text-gray-400">/ 7</span>
                </div>

                {/* remaining pill */}
                <div className="ml-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-sm font-medium">
                  Remaining: {data ? data.remaining : '—'}
                </div>
              </div>

              {/* nice progress bar */}
              <div className="mt-4 w-72 max-w-full">
                <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-400"
                    style={{
                      width: `${data ? Math.min(100, (data.used / 7) * 100) : 0}%`,
                      background:
                        'linear-gradient(90deg, rgba(59,130,246,1) 0%, rgba(99,102,241,1) 100%)'
                    }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-2">Meal swipes reset every Thursday</div>
              </div>
            </div>

            {/* action column */}
            <div className="mt-6 md:mt-0 flex items-start gap-3">
              

              {/* transient status area */}
              <div className="text-sm">
                {scanMessage ? (
                  <div
                    className={`mt-1 px-3 py-1 rounded-md text-sm transition-opacity duration-300 ${
                      scanMessage.type === 'success'
                        ? 'bg-green-50 text-green-700'
                        : scanMessage.type === 'error'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {scanMessage.text}
                  </div>
                ) : (
                  <div className=""></div>
                )}
              </div>
              
              {/* Rescan Button */}
              <button
                onClick={() => rescan.mutate(days)}
                disabled={isRescanning}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm shadow-sm"
              >
                {isRescanning ? 'Rescanning…' : 'Rescan'}
              </button>
            </div>
          </div>

          {/* divider */}
          <div className="h-px bg-gray-100 my-6" />

          {/* list / preview */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">This Week's Meals</h2>
              <div className="text-sm text-gray-400">Last 7 days</div>
            </div>

            {isLoading && (
              <div className="py-8 flex justify-center">
                <div className="text-gray-400">Loading recent meals…</div>
              </div>
            )}

            {error && (
              <div className="text-red-600 py-4">Error loading history: {error.message}</div>
            )}

            {data && data.preview.length === 0 && (
              <div className="text-gray-500 py-6">No swipe emails found for this week.</div>
            )}

            {data && data.preview.length > 0 && (
              <ul className="divide-y divide-gray-100">
                {data.preview.map((p: any) => (
                  <li key={p.messageId} className="py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm text-gray-600">
                          {new Date(p.occurredAt).toLocaleString()}
                        </div>
                        <div className="mt-1 text-sm font-medium text-gray-900">
                          {p.store ?? 'Unknown store'}
                        </div>
                      </div>

                      <div className="text-sm text-gray-700 font-medium">{p.meals}M</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* small footer hint */}
        <div className="text-xs text-gray-400 mt-6">
          Tip: connect your Gmail to enable automatic scanning. (Local dev uses token.json)
        </div>
      </div>
    </main>
  );
}
