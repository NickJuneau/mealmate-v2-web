// app/history/page.tsx (client)
'use client';
import { useMemo, useState } from 'react';
import { useHistory } from '@/app/lib/hooks/useSwipes';

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function HistoryPage() {
  const [days] = useState(30);
  const { data, isLoading, error } = useHistory(days);

  const csvRows = useMemo(() => {
    if (!data?.events) return [];
    const header = ['#", "Date/Time', 'Store', 'Order ID', 'Meals'];
    const body = data.events.map((e: any, i: number) => [
      (i + 1).toString(),
      new Date(e.occurredAt).toLocaleString(),
      e.store ?? '',
      e.orderId ?? '',
      (e.meals ?? '').toString()
    ]);
    return [header, ...body];
  }, [data]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold">History</h1>
            <p className="text-sm text-gray-400">Recent swipe emails (last {days} days)</p>
          </div>

        {/* Optional inclusion of EXPORT CSV. As of now not implemented. */}
          {/* <div className="flex items-center gap-3">
            <button
              onClick={() => csvRows.length > 1 && downloadCsv('mealmate-history.csv', csvRows)}
              disabled={!csvRows || csvRows.length <= 1}
              className="text-sm inline-flex items-center gap-2 px-3 py-1 rounded-md bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
            >
              Export CSV
            </button>
          </div> */}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {isLoading && (
            <div className="py-8 flex justify-center text-gray-500">Loading history…</div>
          )}

          {error && (
            <div className="py-4 text-red-600">Error loading history: {error.message}</div>
          )}

          {!isLoading && data && data.events.length === 0 && (
            <div className="py-8 text-gray-500">No recent swipe emails found.</div>
          )}

          {data && data.events.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-white sticky top-0">
                  <tr>
                    {/* Date/Time - left aligned */}
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Date/Time</th>

                    {/* Store - left aligned (header aligns with cells) */}
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Store</th>

                    {/* Order ID - center this column header/content to match */}
                    <th className="text-center px-4 py-2 text-xs font-medium text-gray-500 uppercase w-36">Order ID</th>

                    {/* Swipe - right aligned */}
                    <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase w-20">Swipe</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-100">
                  {data.events.map((e: any, i: number) => (
                    <tr key={e.messageId} className="hover:bg-gray-50">
                      {/* Date/Time */}
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                        {new Date(e.occurredAt).toLocaleString()}
                      </td>

                      {/* Store */}
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                        {e.store ?? 'Unknown'}
                      </td>

                      {/* Order ID (center) */}
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">
                        {e.orderId ?? '-'}
                      </td>

                      {/* Swipe (right) */}
                      <td className="px-4 py-3 text-sm text-gray-700 text-right font-semibold">
                        {e.meals}M
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-400 mt-4">
          Tip: History shows parsed swipe emails. If an item looks incorrect, open the raw email for debugging.
        </div>
      </div>
    </main>
  );
}
