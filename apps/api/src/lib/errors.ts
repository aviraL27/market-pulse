import { config } from "../config.js";

/** Avoid leaking Supabase/Postgres internals to clients in production. */
export function clientErrorMessage(fallback: string, detail?: string): string {
  if (config.nodeEnv === "development" && detail) return detail;
  return fallback;
}
