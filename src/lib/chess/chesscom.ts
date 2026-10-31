import { createServerFn } from "@tanstack/react-start";

export type ChessComGame = {
  id: string;
  white: string;
  black: string;
  whiteRating: number;
  blackRating: number;
  result: string;
  timeClass: string;
  endTime: number;
  url: string;
  accuracy: { w: number; b: number } | null;
  pgn: string;
};

export type ChessComLookup =
  | { ok: true; username: string; games: ChessComGame[] }
  | { ok: false; error: string };

type Side = { username?: string; rating?: number; result?: string };
type RawGame = {
  uuid?: string;
  url?: string;
  pgn?: string;
  rules?: string;
  time_class?: string;
  end_time?: number;
  white?: Side;
  black?: Side;
  accuracies?: { white?: number; black?: number };
};

const USER = /^[a-z0-9][a-z0-9_-]{1,24}$/i;

function scoreOf(white?: string, black?: string): string {
  if (white === "win") return "1-0";
  if (black === "win") return "0-1";
  if (white === "agreed" || white === "repetition" || white === "stalemate" || white === "insufficient" || white === "50move" || white === "timevsinsufficient") {
    return "½-½";
  }
  return "—";
}

async function pub(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Villiance/1.0 (public game review)",
    },
    signal: AbortSignal.timeout(12000),
  });
}

function slim(game: RawGame): ChessComGame | null {
  if (!game.pgn || (game.rules && game.rules !== "chess")) return null;
  const accuracy =
    typeof game.accuracies?.white === "number" && typeof game.accuracies?.black === "number"
      ? { w: game.accuracies.white, b: game.accuracies.black }
      : null;
  return {
    id: game.uuid || game.url || game.pgn.slice(0, 40),
    white: game.white?.username || "White",
    black: game.black?.username || "Black",
    whiteRating: game.white?.rating || 0,
    blackRating: game.black?.rating || 0,
    result: scoreOf(game.white?.result, game.black?.result),
    timeClass: game.time_class || "game",
    endTime: game.end_time || 0,
    url: game.url || "",
    accuracy,
    pgn: game.pgn,
  };
}

export const loadChessComGames = createServerFn({ method: "POST" })
  .validator((input: { username: string }) => {
    const username = input.username.trim();
    if (!USER.test(username)) throw new Error("Enter a Chess.com username.");
    return { username };
  })
  .handler(async ({ data }): Promise<ChessComLookup> => {
    const username = data.username;
    try {
      const listed = await pub(`https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/archives`);
      if (listed.status === 404) return { ok: false, error: "No Chess.com player with that username." };
      if (!listed.ok) return { ok: false, error: "Chess.com did not answer." };
      const body = (await listed.json()) as { archives?: string[] };
      const archives = (body.archives ?? []).slice(-2).reverse();
      if (archives.length === 0) return { ok: true, username, games: [] };
      const games: ChessComGame[] = [];
      for (const url of archives) {
        const res = await pub(url);
        if (!res.ok) continue;
        const month = (await res.json()) as { games?: RawGame[] };
        const rows = (month.games ?? [])
          .map(slim)
          .filter((game): game is ChessComGame => game !== null)
          .sort((a, b) => b.endTime - a.endTime);
        for (const game of rows) {
          if (games.length >= 12) break;
          games.push(game);
        }
        if (games.length >= 12) break;
      }
      return { ok: true, username, games };
    } catch {
      return { ok: false, error: "Could not reach Chess.com." };
    }
  });
