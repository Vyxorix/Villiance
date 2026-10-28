import { Chess } from "chess.js";
import eco from "./eco.json";

/**
 * Opening book compiled from the Lichess chess-openings set (ECO A00–E99).
 * Positions are matched by placement, side to move, castling rights, and en
 * passant — so transpositions land on the same name. A move is book only when
 * the position it reaches is on a known line, not merely because the game
 * started with 1. e4.
 */
const names = eco.names;
const book = eco.book as Record<string, number>;

function positionKey(chess: Chess): string {
  return chess.fen().split(" ").slice(0, 4).join(" ");
}

function playLine(sans: string[]): Chess | null {
  const chess = new Chess();
  for (const san of sans) {
    try {
      if (!chess.move(san)) return null;
    } catch {
      return null;
    }
  }
  return chess;
}

export function openingName(sans: string[]): string | null {
  if (sans.length === 0) return "Starting position";
  const chess = new Chess();
  let last: string | null = null;
  for (const san of sans) {
    try {
      if (!chess.move(san)) break;
    } catch {
      break;
    }
    const idx = book[positionKey(chess)];
    if (idx !== undefined) last = names[idx] ?? last;
  }
  return last;
}

export function isBookMove(sans: string[]): boolean {
  if (sans.length === 0 || sans.length > 32) return false;
  const chess = playLine(sans);
  if (!chess) return false;
  return book[positionKey(chess)] !== undefined;
}
