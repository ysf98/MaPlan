export function extractSearchQueryFromLink(value: string): string {
  const raw = value.trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    const q = url.searchParams.get("q");
    if (q?.trim()) return q.trim();

    const pathname = decodeURIComponent(url.pathname || "");
    const placeMatch = pathname.match(/\/place\/([^/]+)/i);
    if (placeMatch?.[1]) {
      return placeMatch[1].replace(/\+/g, " ").trim();
    }
    return raw;
  } catch {
    return raw;
  }
}
