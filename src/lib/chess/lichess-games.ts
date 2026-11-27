import { createServerFn } from "@tanstack/react-start";
import type { ChessComGame } from "./chesscom";
import { allowLookup, fetchPublic, httpsUrl } from "./public-http";

export type LichessLookup =
  | { ok: true; username: string; games: ChessComGame[] }
  | { ok: false; error: string };

const USER = /^[a-z0-9][a-z0-9_-]{1,29}$/i;

type LichessUser = { name?: string };
type LichessGame = {
  id?: string;
  variant?: string;
  speed?: string;
  status?: string;
  winner?: "white" | "black";
  createdAt?: number;
  lastMoveAt?: number;
  players?: {
    white?: { user?: LichessUser; rating?: number };
    black?: { user?: LichessUser; rating?: number };
  };
  pgn?: string;
};

function resultOf(game: LichessGame): string {
  if (game.winner === "white") return "1-0";
  if (game.winner === "black") return "0-1";
  if (game.status === "aborted" || game.status === "noStart") return "—";
  return "½-½";
}

function slim(game: LichessGame): ChessComGame | null {
  if (!game.pgn || !game.id) return null;
  if (game.variant && game.variant !== "standard") return null;
  if (game.status === "aborted" || game.status === "noStart") return null;
  return {
    id: game.id,
    white: game.players?.white?.user?.name || "White",
    black: game.players?.black?.user?.name || "Black",
    whiteRating: game.players?.white?.rating || 0,
    blackRating: game.players?.black?.rating || 0,
    result: resultOf(game),
    timeClass: game.speed || "game",
    endTime: game.lastMoveAt || game.createdAt || 0,
    url: game.id && /^[a-zA-Z0-9]{8,12}$/.test(game.id) ? `https://lichess.org/${game.id}` : "",
    accuracy: null,
    pgn: game.pgn.length > 200_000 ? game.pgn.slice(0, 200_000) : game.pgn,
  };
}

export const loadLichessGames = createServerFn({ method: "POST" })
  .validator((input: { username: string }) => {
    const username = input.username.trim();
    if (!USER.test(username)) throw new Error("Enter a Lichess username.");
    return { username };
  })
  .handler(async ({ data }): Promise<LichessLookup> => {
    const username = data.username;
    if (!allowLookup("all", 40) || !allowLookup(`lichess:${username.toLowerCase()}`)) {
      return { ok: false, error: "Too many lookups. Wait a moment." };
    }
    const url = httpsUrl(
      `https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=12&pgnInJson=true&clocks=false&evals=false&opening=true`,
      "lichess.org",
    );
    if (!url || !url.pathname.startsWith("/api/games/user/")) {
      return { ok: false, error: "Enter a Lichess username." };
    }
    try {
      const res = await fetchPublic(
        url.toString(),
        "lichess.org",
        { Accept: "application/x-ndjson", "User-Agent": "Villiance/1.0 (public game review)" },
        600_000,
      );
      if (!res) return { ok: false, error: "Lichess did not answer." };
      if (res.status === 404) return { ok: false, error: "No Lichess player with that username." };
      if (res.status !== 200) return { ok: false, error: "Lichess did not answer." };
      const games = res.body
        .split("\n")
        .slice(0, 12)
        .map((line) => line.trim())
        .filter(Boolean)
        .flatMap((line) => {
          try {
            const row = slim(JSON.parse(line) as LichessGame);
            return row ? [row] : [];
          } catch {
            return [];
          }
        });
      return { ok: true, username, games };
    } catch {
      return { ok: false, error: "Could not reach Lichess." };
    }
  });
