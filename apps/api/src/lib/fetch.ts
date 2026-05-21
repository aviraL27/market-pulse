const DEFAULT_HEADERS = {
  Accept: "application/json",
  "User-Agent": "MarketPulse/1.0 (https://github.com/market-pulse)",
};

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...DEFAULT_HEADERS, ...init?.headers },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${new URL(url).hostname}`);
  }
  return res.json() as Promise<T>;
}
