import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, Eye, Search, AlertCircle, RefreshCw } from "lucide-react";
import {
  useDashboard,
  useTrending,
  useTopViewed,
  useTrendingSearches,
  useRecentSearches,
} from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { useUiStore } from "@/stores/uiStore";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";

export function DashboardPage() {
  const { user } = useAuth();
  const dashboard = useDashboard();
  const trending = useTrending();
  const topViewed = useTopViewed();
  const trendingSearches = useTrendingSearches();
  const { data: recentApi } = useRecentSearches(!!user);
  const recentLocal = useUiStore((s) => s.recentLocalSearches);
  const recent = recentApi?.length ? recentApi : recentLocal;

  const apiError = dashboard.error ?? trending.error;
  const refetchAll = () => {
    void dashboard.refetch();
    void trending.refetch();
    void topViewed.refetch();
  };

  return (
    <div className="space-y-10">
      <div>
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-3xl font-semibold tracking-tight"
        >
          Market dashboard
        </motion.h1>
        <p className="mt-1 text-ink-muted">
          Live prices from crypto, FX, food & commodities — updated continuously.
        </p>
      </div>

      {apiError && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50/90 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
            <div>
              <p className="font-medium text-red-900">Could not load market data</p>
              <p className="mt-1 text-sm text-red-800">
                {apiError instanceof Error ? apiError.message : "API unreachable"} — make sure the
                API is running at{" "}
                <code className="rounded bg-red-100 px-1">
                  {import.meta.env.VITE_API_URL ?? "http://localhost:3001"}
                </code>
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={refetchAll} className="shrink-0 gap-2">
            <RefreshCw className="h-4 w-4" /> Retry
          </Button>
        </div>
      )}

      <section>
        <SectionHeader icon={Flame} title="Trending movers" />
        <ProductGrid
          items={trending.data}
          isLoading={trending.isLoading}
          isError={trending.isError}
          emptyMessage="No trending products yet."
        />
      </section>

      <section>
        <SectionHeader icon={Eye} title="Top viewed" />
        <ProductGrid
          items={topViewed.data}
          isLoading={topViewed.isLoading}
          isError={topViewed.isError}
          getViews={(p) => (p as { views_count?: number }).views_count}
          emptyMessage="View products to see top picks here."
        />
      </section>

      <section>
        <SectionHeader icon={Search} title="Live markets" />
        <ProductGrid
          items={dashboard.data}
          isLoading={dashboard.isLoading}
          isError={dashboard.isError}
          emptyMessage="No market data returned. Check API logs and retry."
        />
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold">Trending searches</h3>
          <ul className="mt-4 space-y-2">
            {(trendingSearches.data ?? []).length === 0 ? (
              <li className="text-sm text-ink-muted">Search products to see trends</li>
            ) : (
              trendingSearches.data?.map((s) => (
                <li key={s.term}>
                  <Link
                    to={`/app/search?q=${encodeURIComponent(s.term)}`}
                    className="flex justify-between text-sm hover:text-accent"
                  >
                    <span>{s.term}</span>
                    <span className="text-ink-muted">{Math.round(s.score)}</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="glass rounded-2xl p-6">
          <h3 className="font-semibold">Recent searches</h3>
          <ul className="mt-4 flex flex-wrap gap-2">
            {recent.length === 0 ? (
              <li className="text-sm text-ink-muted">No recent searches yet</li>
            ) : (
              recent.map((term) => (
                <Link
                  key={term}
                  to={`/app/search?q=${encodeURIComponent(term)}`}
                  className="rounded-full bg-cream-dark px-3 py-1 text-sm hover:bg-accent/10 hover:text-accent"
                >
                  {term}
                </Link>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-5 w-5 text-accent" />
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

function ProductGrid({
  items,
  isLoading,
  isError,
  emptyMessage,
  getViews,
}: {
  items?: Parameters<typeof ProductCard>[0]["product"][];
  isLoading?: boolean;
  isError?: boolean;
  emptyMessage?: string;
  getViews?: (p: Parameters<typeof ProductCard>[0]["product"]) => number | undefined;
}) {
  if (isLoading && !items?.length) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!isLoading && !isError && (!items || items.length === 0)) {
    return <p className="text-sm text-ink-muted">{emptyMessage ?? "No products to show."}</p>;
  }

  if (isError && !items?.length) {
    return null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {(items ?? []).map((product, i) => (
        <ProductCard
          key={product.id}
          product={product}
          index={i}
          views={getViews?.(product)}
        />
      ))}
    </div>
  );
}
