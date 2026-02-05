// lib/hooks/useSwipes.ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

type SwipesResponse = {
  weekStart: string;
  used: number;
  remaining: number;
  preview: any[];
  meta?: { usedRecent?: number; totalFoundRecent?: number };
};

type HistoryResponse = {
  weekStart: string;
  usedRecent: number;
  events: any[];
};

export function useSwipes(days = 7) {
  return useQuery<SwipesResponse, Error>({
    queryKey: ['swipes', days],
    queryFn: async () => {
      const res = await fetch(`/api/swipes?days=${days}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch swipes');
      }
      return res.json();
    },
    // options
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 // 1 minute
  });
}

export function useHistory(days = 30) {
  return useQuery<HistoryResponse, Error>({
    queryKey: ['history', days],
    queryFn: async () => {
      const res = await fetch(`/api/history?days=${days}`);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch history');
      }
      return res.json();
    },
    refetchOnWindowFocus: false
  });
}

export function useRescan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (days: number = 7) => {
      // We call GET /api/swipes to trigger a fresh scan (server-side scan)
      const res = await fetch(`/api/swipes?days=${days}`);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || 'Rescan failed');
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
