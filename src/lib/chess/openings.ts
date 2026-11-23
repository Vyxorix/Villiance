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

export function bookMoves(sans: string[]): string[] {
  const chess = sans.length === 0 ? new Chess() : playLine(sans);
  if (!chess) return [];
  const out: string[] = [];
  for (const move of chess.moves({ verbose: true })) {
    const next = new Chess(chess.fen());
    next.move(move);
    if (book[positionKey(next)] !== undefined) out.push(move.san);
  }
  return out;
}

const BOOK_PREFER = ["e4", "d4", "Nf3", "c4", "e5", "c5", "Nc6", "Nf6", "d5", "e6", "c6", "g6", "Bb5", "Bc4", "Be7", "O-O"];

/** A book reply for the engine, or null once the position has left theory. */
export function pickBookReply(sans: string[], engineSan: string | null): string | null {
  if (sans.length >= 16) return null;
  const choices = bookMoves(sans);
  if (choices.length === 0) return null;
  if (engineSan && choices.includes(engineSan)) return engineSan;
  return BOOK_PREFER.find((san) => choices.includes(san)) ?? choices[0] ?? null;
}

export type OpeningReport = {
  name: string | null;
  leftIndex: number | null;
  leftSan: string | null;
  wanted: string[];
};

/** Where the game left the book, and which book moves were still available. */
export function openingReport(sans: string[]): OpeningReport {
  let lastBook = -1;
  for (let i = 0; i < sans.length; i++) {
    if (!isBookMove(sans.slice(0, i + 1))) break;
    lastBook = i;
  }
  const name = openingName(lastBook >= 0 ? sans.slice(0, lastBook + 1) : []);
  if (sans.length === 0 || lastBook === sans.length - 1) {
    return { name, leftIndex: null, leftSan: null, wanted: [] };
  }
  const leftIndex = lastBook + 1;
  return {
    name,
    leftIndex,
    leftSan: sans[leftIndex] ?? null,
    wanted: [...bookMoves(sans.slice(0, leftIndex))].sort((a, b) => {
      const ia = BOOK_PREFER.indexOf(a);
      const ib = BOOK_PREFER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    }).slice(0, 4),
  };
}

export type OpeningLine = { eco: string; name: string; sans: string[] };

let catalog: OpeningLine[] | null = null;

/** Named lines from the Lichess opening book, in their usual move order. */
export async function openingCatalog(): Promise<OpeningLine[]> {
  if (catalog) return catalog;
  const mod = (await import("./lines.json")) as { default: OpeningLine[] };
  catalog = mod.default;
  return catalog;
}
