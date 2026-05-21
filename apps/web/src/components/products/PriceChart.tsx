import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PricePoint } from "@market-pulse/shared";

type RangeKey = "7d" | "30d" | "90d" | "all";

const RANGES: { key: RangeKey; label: string; days: number | null }[] = [
  { key: "7d", label: "7D", days: 7 },
  { key: "30d", label: "30D", days: 30 },
  { key: "90d", label: "90D", days: 90 },
  { key: "all", label: "All", days: null },
];

function filterByRange(history: PricePoint[], days: number | null): PricePoint[] {
  if (!days || history.length === 0) return history;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const filtered = history.filter((p) => p.date >= cutoffStr);
  return filtered.length >= 2 ? filtered : history;
}

function computeYDomain(prices: number[]): [number, number] {
  if (prices.length === 0) return [0, 1];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const spread = max - min;
  const pad = spread > 0 ? spread * 0.12 : Math.max(min * 0.05, 0.01);
  return [min - pad, max + pad];
}

function formatPrice(value: number): string {
  if (value >= 1000) return value.toLocaleString(undefined, { maximumFractionDigits: 0 });
  if (value >= 1) return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return value.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}

function formatAxisDate(date: string, total: number): string {
  const d = new Date(date + "T12:00:00");
  if (total > 60) {
    return d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
  }
  if (total > 14) {
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
}

export function PriceChart({ history }: { history: PricePoint[] }) {
  const [range, setRange] = useState<RangeKey>("all");

  const sorted = useMemo(
    () => [...(history ?? [])].sort((a, b) => a.date.localeCompare(b.date)),
    [history]
  );

  const rangeDays = RANGES.find((r) => r.key === range)?.days ?? null;
  const chartData = useMemo(() => filterByRange(sorted, rangeDays), [sorted, rangeDays]);
  const yDomain = useMemo(() => computeYDomain(chartData.map((p) => p.price)), [chartData]);

  if (!sorted.length) {
    return (
      <div className="flex h-56 items-center justify-center rounded-xl bg-cream-dark/50 text-sm text-ink-muted">
        No historical data available
      </div>
    );
  }

  const tickInterval = Math.max(0, Math.floor(chartData.length / 6) - 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {chartData.length} days · {sorted[0]?.date} → {sorted[sorted.length - 1]?.date}
        </p>
        <div className="flex rounded-lg bg-cream-dark/80 p-1">
          {RANGES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                range === key ? "bg-white text-accent shadow-sm" : "text-ink-muted hover:text-ink"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 w-full rounded-xl bg-cream-dark/30 px-1 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#40916c" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#40916c" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "#5c5c5c" }}
              tickFormatter={(d) => formatAxisDate(String(d), chartData.length)}
              axisLine={false}
              tickLine={false}
              interval={tickInterval}
              minTickGap={32}
            />
            <YAxis
              domain={yDomain}
              tick={{ fontSize: 11, fill: "#5c5c5c" }}
              tickFormatter={(v) => formatPrice(Number(v))}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            <Tooltip
              labelFormatter={(label) =>
                new Date(String(label) + "T12:00:00").toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              }
              formatter={(value) => [formatPrice(Number(value)), "Price"]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.5)",
                background: "rgba(255,255,255,0.95)",
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#2d6a4f"
              strokeWidth={2}
              fill="url(#priceGrad)"
              dot={chartData.length <= 14}
              activeDot={{ r: 4, fill: "#2d6a4f" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
