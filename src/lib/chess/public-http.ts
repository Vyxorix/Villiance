/** Strict fetch helper for the public Chess.com and Lichess lookups. */

const windows = new Map<string, number[]>();

export function allowLookup(key: string, limit = 8, windowMs = 60_000, now = Date.now()): boolean {
  const recent = (windows.get(key) ?? []).filter((at) => now - at < windowMs);
  if (recent.length >= limit) {
    windows.set(key, recent);
    return false;
  }
  recent.push(now);
  windows.set(key, recent);
  if (windows.size > 400) {
    const oldest = windows.keys().next().value;
    if (oldest) windows.delete(oldest);
  }
  return true;
}

export function httpsUrl(raw: string, host: string): URL | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== host || url.port !== "") return null;
  if (url.username || url.password) return null;
  return url;
}

/** A Chess.com monthly archive for this exact player, and nothing else. */
export function chessComArchive(username: string, raw: string): string | null {
  const url = httpsUrl(raw, "api.chess.com");
  if (!url) return null;
  const path = url.pathname.toLowerCase();
  const prefix = `/pub/player/${username.toLowerCase()}/games/`;
  if (!path.startsWith(prefix)) return null;
  if (!/^\/pub\/player\/[a-z0-9][a-z0-9_-]{1,24}\/games\/\d{4}\/(0[1-9]|1[0-2])$/.test(path)) return null;
  url.search = "";
  url.hash = "";
  return url.toString();
}

export async function fetchPublic(
  raw: string,
  host: string,
  headers: Record<string, string>,
  maxBytes: number,
): Promise<{ status: number; body: string } | null> {
  const url = httpsUrl(raw, host);
  if (!url) return null;
  url.hash = "";
  const res = await fetch(url, {
    headers,
    redirect: "error",
    signal: AbortSignal.timeout(12_000),
  });
  const declared = Number(res.headers.get("content-length") ?? "0");
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  if (!res.body) return { status: res.status, body: "" };
  const reader = res.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const step = await reader.read();
    if (step.done) break;
    size += step.value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      return null;
    }
    parts.push(step.value);
  }
  const decoder = new TextDecoder();
  let body = "";
  for (const part of parts) body += decoder.decode(part, { stream: true });
  body += decoder.decode();
  return { status: res.status, body };
}
