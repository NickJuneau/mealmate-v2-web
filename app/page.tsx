// app/page.tsx (client)
'use client';
import { useState } from 'react';
import {
  useSwipes,
  useRescan,
  useDisconnectAccount,
  useDeleteAccount
} from '@/app/lib/hooks/useSwipes';
import { signIn, signOut, useSession } from 'next-auth/react';
import Image from 'next/image';

type ScanMessage = { type: 'info' | 'success' | 'error'; text: string } | null;

function getErrorMessage(err: unknown, fallback: string) {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export default function HomePage() {
  const [days] = useState<number>(7);
  const { status } = useSession();
  const isAuthed = status === 'authenticated';
  const { data, isLoading, error } = useSwipes(days, isAuthed);
  const rescan = useRescan();
  const disconnectAccount = useDisconnectAccount();
  const deleteAccount = useDeleteAccount();
  const lastSyncedLabel = data?.meta?.lastSyncedAt
    ? new Date(data.meta.lastSyncedAt).toLocaleString()
    : 'Not synced yet';

  const isRescanning = rescan.status === 'pending';
  const scanMessage: ScanMessage =
    rescan.status === 'pending'
      ? { type: 'info', text: 'Rescanning...' }
      : rescan.status === 'success'
      ? { type: 'success', text: 'Rescan complete' }
      : rescan.status === 'error'
      ? { type: 'error', text: getErrorMessage(rescan.error, 'Rescan failed') }
      : null;

  const isDisconnecting = disconnectAccount.status === 'pending';
  const isDeletingAccount = deleteAccount.status === 'pending';

  async function handleDisconnect() {
    const confirmed = window.confirm(
      'Disconnect Gmail and remove stored swipe data? You can reconnect later by signing in again.'
    );
    if (!confirmed) return;

    try {
      await disconnectAccount.mutateAsync();
      await signOut({ callbackUrl: '/' });
    } catch {
      // Error is surfaced via mutation state below.
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      'Delete your MealMate account and all stored data? This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      await deleteAccount.mutateAsync();
      await signOut({ callbackUrl: '/' });
    } catch {
      // Error is surfaced via mutation state below.
    }
  }

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
            <h1 className="text-xl font-semibold text-gray-900">Connect Gmail to Start</h1>
            <p className="mt-2 text-sm text-gray-600">
              Sign in with Google to read your meal swipe emails and populate this dashboard.
            </p>
            <button
              onClick={() => signIn('google', { callbackUrl: '/' })}
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
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <div className="flex items-center gap-4">
            <Image src="/favicon-16.svg" alt="secondary logo" width={50} height={50} />
            <div>
              <div className="text-sm text-gray-600">MealMate</div>
              <div className="text-xs text-gray-400">Meal tracker</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-8">
          <div className="md:flex md:items-center md:justify-between gap-6">
            <div>
              <div className="text-sm text-gray-500">This week</div>

              <div className="mt-2 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="text-5xl sm:text-6xl font-extrabold leading-none">
                  {data ? data.used : '-'} <span className="text-2xl font-medium text-gray-400">/ 7</span>
                </div>

                <div className="px-3 py-1 rounded-full bg-[#FDECEE] text-[#9C000D] text-sm font-medium sm:ml-2">
                  Remaining: {data ? data.remaining : '-'}
                </div>
              </div>

              <div className="mt-4 w-72 max-w-full">
                <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-400"
                    style={{
                      width: `${data ? Math.min(100, (data.used / 7) * 100) : 0}%`,
                      background: 'linear-gradient(90deg, #9C000D 0%, #C1121F 100%)'
                    }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-2">Meal swipes reset every Thursday</div>
                <div className="text-xs text-gray-400 mt-1">Last synced: {lastSyncedLabel}</div>
              </div>
            </div>

            <div className="mt-6 md:mt-0 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-start">
              <div className="text-sm min-h-[1.5rem]">
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
                  <div />
                )}
              </div>

              <button
                onClick={() => rescan.mutate(days)}
                disabled={isRescanning}
                className="inline-flex items-center justify-center gap-2 bg-[#9C000D] hover:bg-[#B30012] disabled:opacity-60 text-white px-4 py-2 rounded-lg text-sm shadow-sm"
              >
                Rescan
              </button>
            </div>
          </div>

          <div className="h-px bg-gray-100 my-6" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">This Week&apos;s Meals</h2>
              <div className="text-sm text-gray-400">Last 7 days</div>
            </div>

            {isLoading && (
              <div className="py-8 flex justify-center">
                <div className="text-gray-400">Loading recent meals...</div>
              </div>
            )}

            {error && (
              <div className="text-red-600 py-4">Error loading history: {error.message}</div>
            )}

            {data && data.preview.length === 0 && (
              <div className="text-gray-500 py-6">No meal swipes found this week.</div>
            )}

            {data && data.preview.length > 0 && (
              <ul className="divide-y divide-gray-100">
                {data.preview.map((p) => (
                  <li key={p.messageId} className="py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-sm text-gray-600">{new Date(p.occurredAt).toLocaleString()}</div>
                        <div className="mt-1 text-sm font-medium text-gray-900">{p.store ?? 'Unknown store'}</div>
                      </div>

                      <div className="text-sm text-gray-700 font-medium">{p.meals}M</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
          <h3 className="text-base font-semibold text-gray-900">Account and Data</h3>
          <p className="mt-2 text-sm text-gray-600">
            Disconnect Gmail access or permanently delete your MealMate account and stored data.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDisconnect}
              disabled={isDisconnecting || isDeletingAccount}
              className="inline-flex items-center justify-center rounded-md border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60"
            >
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect Gmail'}
            </button>
            <button
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount || isDisconnecting}
              className="inline-flex items-center justify-center rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-60"
            >
              {isDeletingAccount ? 'Deleting...' : 'Delete My Account'}
            </button>
          </div>

          {disconnectAccount.status === 'error' && (
            <p className="mt-3 text-sm text-red-600">
              {getErrorMessage(disconnectAccount.error, 'Disconnect failed')}
            </p>
          )}
          {deleteAccount.status === 'error' && (
            <p className="mt-2 text-sm text-red-600">
              {getErrorMessage(deleteAccount.error, 'Delete account failed')}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
