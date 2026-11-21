import { createServerFn } from "@tanstack/react-start";
import type { ChessComGame } from "./chesscom";

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
    url: `https://lichess.org/${game.id}`,
    accuracy: null,
    pgn: game.pgn,
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
    try {
      const url = `https://lichess.org/api/games/user/${encodeURIComponent(username)}?max=12&pgnInJson=true&clocks=false&evals=false&opening=true`;
      const res = await fetch(url, {
        headers: {
          Accept: "application/x-ndjson",
          "User-Agent": "Villiance/1.0 (public game review)",
        },
        signal: AbortSignal.timeout(12000),
      });
      if (res.status === 404) return { ok: false, error: "No Lichess player with that username." };
      if (!res.ok) return { ok: false, error: "Lichess did not answer." };
      const text = await res.text();
      const games = text
        .split("\n")
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
