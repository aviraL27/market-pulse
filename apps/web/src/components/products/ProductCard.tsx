import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Bookmark, TrendingDown, TrendingUp } from "lucide-react";
import type { MarketProduct } from "@market-pulse/shared";
import { useWatchlist, useWatchlistMutations } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { safeImageUrl } from "@/lib/safeUrl";

const sourceColors: Record<string, string> = {
  crypto: "bg-amber-100 text-amber-800",
  food: "bg-emerald-100 text-emerald-800",
  fx: "bg-blue-100 text-blue-800",
  commodity: "bg-orange-100 text-orange-800",
};

export function ProductCard({
  product,
  index = 0,
  views,
}: {
  product: MarketProduct;
  index?: number;
  views?: number;
}) {
  const { user } = useAuth();
  const { data: watchlist } = useWatchlist();
  const { add, remove } = useWatchlistMutations();
  const isSaved = watchlist?.some((w) => w.product_id === product.id);
  const change = product.price_change_pct;
  const isUp = change !== null && change >= 0;
  const imageUrl = safeImageUrl(product.image_url);

  const toggleWatch = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    if (isSaved) remove.mutate(product.id);
    else add.mutate(product.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link
        to={`/app/product/${encodeURIComponent(product.id)}`}
        className="glass group block rounded-2xl p-5 transition hover:shadow-lg"
      >
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt=""
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-dark text-sm font-semibold text-accent">
                {product.name.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="font-semibold leading-tight group-hover:text-accent">
                {product.name}
              </h3>
              <p className="text-xs text-ink-muted">{product.region}</p>
            </div>
          </div>
          {user && (
            <button
              type="button"
              onClick={toggleWatch}
              className={`rounded-lg p-2 transition ${
                isSaved ? "text-accent" : "text-ink-muted hover:text-accent"
              }`}
              aria-label={isSaved ? "Remove from watchlist" : "Add to watchlist"}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
            </button>
          )}
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${sourceColors[product.source] ?? "bg-gray-100"}`}>
            {product.source}
          </span>
          <span className="rounded-full bg-cream-dark px-2 py-0.5 text-xs text-ink-muted">
            {product.category}
          </span>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-semibold tracking-tight">
              {formatPrice(product.current_price, product.currency, product.source)}
            </p>
            {change !== null && (
              <p
                className={`mt-0.5 flex items-center gap-1 text-sm font-medium ${
                  isUp ? "text-accent" : "text-red-600"
                }`}
              >
                {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                {isUp ? "+" : ""}
                {change.toFixed(2)}%
              </p>
            )}
          </div>
          {views !== undefined && views > 0 && (
            <span className="text-xs text-ink-muted">{views} views</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function formatPrice(price: number, _currency: string, source: string): string {
  if (source === "fx") return price.toFixed(4);
  if (source === "crypto" && price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (source === "commodity" && price > 100) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${source === "fx" ? "" : ""}`.trim();
}
