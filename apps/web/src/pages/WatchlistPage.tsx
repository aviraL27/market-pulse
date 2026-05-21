import { Link } from "react-router-dom";
import { Bookmark } from "lucide-react";
import { useWatchlist } from "@/hooks/useProducts";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import type { MarketProduct } from "@market-pulse/shared";

export function WatchlistPage() {
  const { data, isLoading } = useWatchlist();

  const products = (data ?? [])
    .map((w) => w.product as MarketProduct | null | undefined)
    .filter((p): p is MarketProduct => !!p && !!p.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bookmark className="h-6 w-6 text-accent" />
        <h1 className="text-3xl font-semibold tracking-tight">Your watchlist</h1>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-ink-muted">No saved products yet.</p>
          <Link to="/app/search" className="mt-4 inline-block text-accent hover:underline">
            Search markets →
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
