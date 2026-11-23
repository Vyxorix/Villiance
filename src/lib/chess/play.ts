import type { Chess } from "chess.js";
import type { Color } from "./types";

export type Outcome = { winner: "w" | "b" | "draw"; reason: string };

export const STRENGTHS = [
  { elo: 0, label: "Full" },
  { elo: 1200, label: "1200" },
  { elo: 1500, label: "1500" },
  { elo: 1800, label: "1800" },
  { elo: 2100, label: "2100" },
] as const;

export const CLOCKS = [
  { ms: 0, label: "Off" },
  { ms: 3 * 60_000, label: "3 min" },
  { ms: 5 * 60_000, label: "5 min" },
  { ms: 10 * 60_000, label: "10 min" },
] as const;

/** Stockfish Skill Level. Full strength is 20. A rating uses the lower levels. */
export function skillForStrength(elo: number): number {
  if (!elo) return 20;
  return Math.max(0, Math.min(19, Math.round((elo - 1200) / 75)));
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function outcomeFromChess(chess: Chess, playerColor: Color): Outcome | null {
  if (!chess.isGameOver()) return null;
  if (chess.isCheckmate()) {
    const winner: Color = chess.turn() === "w" ? "b" : "w";
    const who = winner === playerColor ? "You won" : "You lost";
    return { winner, reason: `${who} by checkmate` };
  }
  if (chess.isStalemate()) return { winner: "draw", reason: "Draw by stalemate" };
  if (chess.isThreefoldRepetition()) return { winner: "draw", reason: "Draw by repetition" };
  if (chess.isInsufficientMaterial()) return { winner: "draw", reason: "Draw by insufficient material" };
  if (chess.isDrawByFiftyMoves()) return { winner: "draw", reason: "Draw by the fifty-move rule" };
  if (chess.isDraw()) return { winner: "draw", reason: "Draw" };
  return null;
}
