import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Bookmark } from "lucide-react";
import { useProduct, useWatchlist, useWatchlistMutations } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { PriceChart } from "@/components/products/PriceChart";
import { Button } from "@/components/ui/Button";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { safeImageUrl } from "@/lib/safeUrl";

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const decodedId = id ? decodeURIComponent(id) : "";
  const { data: product, isLoading, error } = useProduct(decodedId);
  const { user } = useAuth();
  const { data: watchlist } = useWatchlist();
  const { add, remove } = useWatchlistMutations();
  const isSaved = watchlist?.some((w) => w.product_id === decodedId);

  if (isLoading) {
    return (
      <div className="max-w-2xl">
        <ProductCardSkeleton />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div>
        <Link to="/app" className="text-sm text-accent hover:underline">
          ← Back to dashboard
        </Link>
        <p className="mt-4 text-ink-muted">Product not found</p>
      </div>
    );
  }

  const change = product.price_change_pct;
  const imageUrl = safeImageUrl(product.image_url);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <Link to="/app" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">
        <ArrowLeft className="h-4 w-4" /> Dashboard
      </Link>

      <div className="glass rounded-3xl p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-cream-dark text-2xl font-bold text-accent">
                {product.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-3xl font-semibold">{product.name}</h1>
              <p className="text-ink-muted">
                {product.category} · {product.region} · {product.source}
              </p>
            </div>
          </div>

          {user && (
            <Button
              variant={isSaved ? "primary" : "secondary"}
              onClick={() => (isSaved ? remove.mutate(product.id) : add.mutate(product.id))}
              loading={add.isPending || remove.isPending}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
              {isSaved ? "Watching" : "Add to watchlist"}
            </Button>
          )}
        </div>

        <div className="mt-8 flex flex-wrap items-end gap-6">
          <div>
            <p className="text-sm text-ink-muted">Current price</p>
            <p className="text-4xl font-semibold tracking-tight">
              {product.current_price.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: product.source === "fx" ? 4 : 2,
              })}{" "}
              <span className="text-lg text-ink-muted">{product.currency}</span>
            </p>
          </div>
          {change !== null && (
            <div
              className={`rounded-xl px-4 py-2 text-lg font-semibold ${
                change >= 0 ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"
              }`}
            >
              {change >= 0 ? "+" : ""}
              {change.toFixed(2)}%
            </div>
          )}
        </div>

        <div className="mt-8">
          <h2 className="mb-2 font-semibold">Price history</h2>
          <p className="mb-4 text-sm text-ink-muted">
            Up to 90 days of daily prices. Use the range buttons to zoom the chart.
          </p>
          <PriceChart history={product.history ?? []} />
        </div>
      </div>
    </motion.div>
  );
}
