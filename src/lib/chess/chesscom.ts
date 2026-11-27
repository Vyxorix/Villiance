import { createServerFn } from "@tanstack/react-start";
import { allowLookup, chessComArchive, fetchPublic } from "./public-http";

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

async function pub(url: string): Promise<{ status: number; body: string } | null> {
  return fetchPublic(
    url,
    "api.chess.com",
    { Accept: "application/json", "User-Agent": "Villiance/1.0 (public game review)" },
    1_500_000,
  );
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
    url: game.url && game.url.startsWith("https://www.chess.com/") ? game.url : "",
    accuracy,
    pgn: game.pgn.length > 200_000 ? game.pgn.slice(0, 200_000) : game.pgn,
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
    if (!allowLookup("all", 40) || !allowLookup(`chesscom:${username.toLowerCase()}`)) {
      return { ok: false, error: "Too many lookups. Wait a moment." };
    }
    try {
      const listed = await pub(
        `https://api.chess.com/pub/player/${encodeURIComponent(username)}/games/archives`,
      );
      if (!listed) return { ok: false, error: "Chess.com did not answer." };
      if (listed.status === 404) return { ok: false, error: "No Chess.com player with that username." };
      if (listed.status !== 200) return { ok: false, error: "Chess.com did not answer." };
      const body = JSON.parse(listed.body) as { archives?: unknown };
      const archives = Array.isArray(body.archives) ? body.archives : [];
      const months = archives
        .filter((item): item is string => typeof item === "string")
        .map((item) => chessComArchive(username, item))
        .filter((item): item is string => item !== null)
        .slice(-2)
        .reverse();
      if (months.length === 0) return { ok: true, username, games: [] };
      const games: ChessComGame[] = [];
      for (const url of months) {
        const res = await pub(url);
        if (!res || res.status !== 200) continue;
        const month = JSON.parse(res.body) as { games?: RawGame[] };
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
      return { ok: true, username, games: games.slice(0, 12) };
    } catch {
      return { ok: false, error: "Could not reach Chess.com." };
    }
  });
