// app/history/page.tsx (client)
'use client';
import { useState } from 'react';
import { useHistory } from '@/app/lib/hooks/useSwipes';
import { signIn, useSession } from 'next-auth/react';

export default function HistoryPage() {
  const [days] = useState(30);
  const { status } = useSession();
  const isAuthed = status === 'authenticated';
  const { data, isLoading, error } = useHistory(days, isAuthed);
  const lastSyncedLabel = data?.lastSyncedAt
    ? new Date(data.lastSyncedAt).toLocaleString()
    : 'Not synced yet';

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-gray-500">
            Checking session...
          </div>
        </div>
      </main>
    );
  }

  if (!isAuthed) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h1 className="text-xl font-semibold text-gray-900">Sign In Required</h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in with Google to view your swipe history.
            </p>
            <button
              onClick={() => signIn('google', { callbackUrl: '/history' })}
              className="mt-5 inline-flex items-center rounded-md bg-[#9C000D] px-4 py-2 text-sm font-medium text-white hover:bg-[#B30012]"
            >
              Sign In with Google
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-xl font-semibold">History</h1>
            <p className="text-sm text-gray-400">Recent swipe emails (last {days} days)</p>
            <p className="text-xs text-gray-400 mt-1">Last synced: {lastSyncedLabel}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          {isLoading && (
            <div className="py-8 flex justify-center text-gray-500">Loading history...</div>
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
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                      Date/Time
                    </th>
                    <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">
                      Store
                    </th>
                    <th className="text-center px-4 py-2 text-xs font-medium text-gray-500 uppercase w-36">
                      Order ID
                    </th>
                    <th className="text-right px-4 py-2 text-xs font-medium text-gray-500 uppercase w-20">
                      Swipe
                    </th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-100">
                  {data.events.map((e) => (
                    <tr key={e.messageId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs">
                        {new Date(e.occurredAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-800 font-medium">
                        {e.store ?? 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 text-center">
                        {e.orderId ?? '-'}
                      </td>
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

        <div className="text-xs text-gray-400 mt-4">Note: History shows parsed swipe emails.</div>
      </div>
    </main>
  );
}

