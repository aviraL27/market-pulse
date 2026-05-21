import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.dashboard()).data,
    staleTime: 60_000,
    retry: 2,
  });
}

export function useTrending() {
  return useQuery({
    queryKey: ["trending"],
    queryFn: async () => (await api.trending()).data,
    staleTime: 60_000,
    retry: 2,
  });
}

export function useTopViewed() {
  return useQuery({
    queryKey: ["top-viewed"],
    queryFn: async () => (await api.topViewed()).data,
    staleTime: 30_000,
  });
}

export function useSearch(q: string, source: string, enabled: boolean) {
  return useQuery({
    queryKey: ["search", q, source],
    queryFn: async () => (await api.search(q, source)).data,
    enabled: enabled && q.length >= 2,
    staleTime: 30_000,
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await api.product(id);
      void api.recordView(id);
      return data;
    },
    enabled: !!id,
  });
}

export function useTrendingSearches() {
  return useQuery({
    queryKey: ["trending-searches"],
    queryFn: async () => (await api.trendingSearches()).data,
    staleTime: 30_000,
  });
}

export function useRecentSearches(enabled: boolean) {
  return useQuery({
    queryKey: ["recent-searches"],
    queryFn: async () => (await api.recentSearches()).data,
    enabled,
    staleTime: 15_000,
  });
}

export function useWatchlist() {
  return useQuery({
    queryKey: ["watchlist"],
    queryFn: async () => (await api.watchlist()).data,
  });
}

export function useWatchlistMutations() {
  const qc = useQueryClient();

  const add = useMutation({
    mutationFn: (productId: string) => api.addWatchlist(productId),
    onMutate: async (productId) => {
      await qc.cancelQueries({ queryKey: ["watchlist"] });
      const prev = qc.getQueryData<{ product_id: string }[]>(["watchlist"]) ?? [];
      qc.setQueryData(["watchlist"], [
        ...prev,
        { product_id: productId, created_at: new Date().toISOString(), product: null },
      ]);
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["watchlist"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  const remove = useMutation({
    mutationFn: (productId: string) => api.removeWatchlist(productId),
    onMutate: async (productId) => {
      await qc.cancelQueries({ queryKey: ["watchlist"] });
      const prev = qc.getQueryData<{ product_id: string }[]>(["watchlist"]) ?? [];
      qc.setQueryData(
        ["watchlist"],
        prev.filter((w) => w.product_id !== productId)
      );
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["watchlist"], ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  return { add, remove };
}
