import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { useSearch } from "@/hooks/useProducts";
import { useUiStore } from "@/stores/uiStore";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";

const sources = [
  { value: "all", label: "All markets" },
  { value: "crypto", label: "Crypto" },
  { value: "food", label: "Food" },
  { value: "fx", label: "FX" },
  { value: "commodity", label: "Commodities" },
] as const;

const categories = ["all", "Cryptocurrency", "Food & Grocery", "Foreign Exchange", "Agriculture", "Metals", "Energy"];

export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const initialQ = params.get("q") ?? "";
  const [query, setQuery] = useState(initialQ);
  const sourceFilter = useUiStore((s) => s.sourceFilter);
  const categoryFilter = useUiStore((s) => s.categoryFilter);
  const setSourceFilter = useUiStore((s) => s.setSourceFilter);
  const setCategoryFilter = useUiStore((s) => s.setCategoryFilter);
  const addLocalSearch = useUiStore((s) => s.addLocalSearch);

  const { data, isLoading, isFetching, isError, error } = useSearch(
    query,
    sourceFilter,
    query.trim().length >= 2
  );

  useEffect(() => {
    if (initialQ) setQuery(initialQ);
  }, [initialQ]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim().length >= 2) {
        setParams({ q: query });
        addLocalSearch(query);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [query, setParams, addLocalSearch]);

  const filtered = (data ?? []).filter(
    (p) => categoryFilter === "all" || p.category.toLowerCase().includes(categoryFilter.toLowerCase().slice(0, 4))
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Search markets</h1>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <Input
          className="pl-11"
          placeholder="Search crypto, food, FX, commodities..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {sources.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => setSourceFilter(s.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
              sourceFilter === s.value
                ? "bg-accent text-white"
                : "glass text-ink-muted hover:text-ink"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <select
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value)}
        className="rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm"
      >
        {categories.map((c) => (
          <option key={c} value={c}>
            {c === "all" ? "All categories" : c}
          </option>
        ))}
      </select>

      {query.trim().length < 2 ? (
        <p className="text-ink-muted">Type at least 2 characters to search</p>
      ) : isLoading || isFetching ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : isError ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error instanceof Error ? error.message : "Search failed"}
        </p>
      ) : filtered.length === 0 ? (
        <p className="text-ink-muted">No products found for &quot;{query}&quot;</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
