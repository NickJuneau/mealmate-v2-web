// lib/hooks/useSwipes.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export type SwipeEvent = {
  messageId: string;
  orderId?: string | null;
  occurredAt: string;
  meals: number;
  store?: string | null;
  items?: string[];
};

type SwipesResponse = {
  weekStart: string;
  used: number;
  remaining: number;
  preview: SwipeEvent[];
  meta?: { usedRecent?: number; totalFoundRecent?: number; lastSyncedAt?: string | null };
};

type HistoryResponse = {
  weekStart: string;
  usedRecent: number;
  lastSyncedAt?: string | null;
  events: SwipeEvent[];
};

function parseApiError(text: string, fallback: string) {
  if (!text) return fallback;
  try {
    const parsed = JSON.parse(text) as { error?: string };
    return parsed.error || fallback;
  } catch {
    return text;
  }
}

export function useSwipes(days = 7, enabled = true) {
  return useQuery<SwipesResponse, Error>({
    queryKey: ['swipes', days],
    queryFn: async () => {
      const res = await fetch(`/api/swipes?days=${days}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(parseApiError(text, 'Failed to fetch swipes'));
      }
      return res.json();
    },
    // options
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 // 1 minute
  });
}

export function useHistory(days = 30, enabled = true) {
  return useQuery<HistoryResponse, Error>({
    queryKey: ['history', days],
    queryFn: async () => {
      const res = await fetch(`/api/history?days=${days}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(parseApiError(text, 'Failed to fetch history'));
      }
      return res.json();
    },
    enabled,
    retry: false,
    refetchOnWindowFocus: false
  });
}

export function useRescan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (days: number = 7) => {
      // POST triggers a fresh Gmail sync + DB upsert, then returns summary
      const res = await fetch('/api/swipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ days })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(parseApiError(txt, 'Rescan failed'));
      }
      return res.json();
    },
    onSuccess: () => {
      // Invalidate both queries so UI refetches
      qc.invalidateQueries({ queryKey: ['swipes'] });
      qc.invalidateQueries({ queryKey: ['history'] });
    }
  });
}
