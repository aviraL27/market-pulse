/** Allow only http(s) image URLs from external market APIs. */
export function safeImageUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:") return url;
  } catch {
    /* invalid */
  }
  return undefined;
}
