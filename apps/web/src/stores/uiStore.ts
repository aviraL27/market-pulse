import { create } from "zustand";
import { persist } from "zustand/middleware";

type SourceFilter = "all" | "crypto" | "food" | "fx" | "commodity";

interface UiState {
  searchQuery: string;
  categoryFilter: string;
  sourceFilter: SourceFilter;
  recentLocalSearches: string[];
  setSearchQuery: (q: string) => void;
  setCategoryFilter: (c: string) => void;
  setSourceFilter: (s: SourceFilter) => void;
  addLocalSearch: (term: string) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      searchQuery: "",
      categoryFilter: "all",
      sourceFilter: "all",
      recentLocalSearches: [],
      setSearchQuery: (q) => set({ searchQuery: q }),
      setCategoryFilter: (c) => set({ categoryFilter: c }),
      setSourceFilter: (s) => set({ sourceFilter: s }),
      addLocalSearch: (term) => {
        const t = term.trim().toLowerCase();
        if (!t) return;
        const prev = get().recentLocalSearches.filter((s) => s !== t);
        set({ recentLocalSearches: [t, ...prev].slice(0, 10) });
      },
    }),
    { name: "market-pulse-ui" }
  )
);
