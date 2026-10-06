import { Chess, type Color, type PieceSymbol, type Square } from "chess.js";
import type { Score } from "./types";

export const FILES = "abcdefgh";
export const PIECE_VAL: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

export function opposite(color: Color): Color {
  return color === "w" ? "b" : "w";
}

export function squareFrom(file: number, rank: number): Square {
  return `${FILES[file]}${rank + 1}` as Square;
}

export function parseSquare(sq: Square): { file: number; rank: number } {
  return { file: sq.charCodeAt(0) - 97, rank: Number(sq[1]) - 1 };
}

export function uciParts(uci: string): {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
} {
  return {
    from: uci.slice(0, 2) as Square,
    to: uci.slice(2, 4) as Square,
    promotion: (uci[4] as PieceSymbol | undefined) || undefined,
  };
}

export function toUci(from: string, to: string, promotion?: string): string {
  return from + to + (promotion ?? "");
}

export function materialWhite(chess: Chess): number {
  let total = 0;
  for (const row of chess.board()) {
    for (const p of row) {
      if (!p) continue;
      const v = PIECE_VAL[p.type];
      total += p.color === "w" ? v : -v;
    }
  }
  return total;
}

export function capturedPieces(chess: Chess): { w: PieceSymbol[]; b: PieceSymbol[] } {
  const start: Record<PieceSymbol, number> = { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 };
  const have: Record<Color, Record<PieceSymbol, number>> = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
  };
  for (const row of chess.board()) {
    for (const p of row) {
      if (p) have[p.color][p.type] += 1;
    }
  }
  const missing = (color: Color): PieceSymbol[] => {
    const order: PieceSymbol[] = ["q", "r", "b", "n", "p"];
    const out: PieceSymbol[] = [];
    for (const t of order) {
      const n = Math.max(0, start[t] - have[color][t]);
      for (let i = 0; i < n; i++) out.push(t);
    }
    return out;
  };
  return { w: missing("w"), b: missing("b") };
}

export function whiteScore(score: Score, turn: Color): Score {
  const sign = turn === "w" ? 1 : -1;
  return { type: score.type, value: score.value * sign };
}

export function formatScore(score: Score | null): string {
  if (!score) return "…";
  if (score.type === "mate") {
    if (score.value === 0) return "#";
    return score.value > 0 ? `#${score.value}` : `#-${Math.abs(score.value)}`;
  }
  const pawns = score.value / 100;
  const abs = Math.abs(pawns).toFixed(Math.abs(pawns) >= 10 ? 0 : 1);
  if (pawns > 0.04) return `+${abs}`;
  if (pawns < -0.04) return `-${abs}`;
  return "0.0";
}

export function evalToWhitePct(score: Score | null): number {
  if (!score) return 0.5;
  if (score.type === "mate") {
    if (score.value === 0) return 0.5;
    return score.value > 0 ? 0.97 : 0.03;
  }
  const p = 1 / (1 + Math.exp(-score.value / 280));
  return Math.min(0.97, Math.max(0.03, p));
}

export function pvToSan(fen: string, pv: string[]): string[] {
  const chess = new Chess(fen);
  const san: string[] = [];
  for (const u of pv) {
    const parts = uciParts(u);
    try {
      const mv = chess.move(parts);
      if (!mv) break;
      san.push(mv.san);
    } catch {
      break;
    }
  }
  return san;
}

export function kingSquare(chess: Chess, color: Color): Square | null {
  const sq = chess.findPiece({ type: "k", color })[0];
  return sq ?? null;
}

export function destAttacked(chess: Chess, square: Square, by: Color): boolean {
  return chess.isAttacked(square, by);
}

export function statusText(chess: Chess): string | null {
  if (chess.isCheckmate()) {
    return chess.turn() === "w" ? "Black wins by checkmate" : "White wins by checkmate";
  }
  if (chess.isStalemate()) return "Draw by stalemate";
  if (chess.isThreefoldRepetition()) return "Draw by repetition";
  if (chess.isInsufficientMaterial()) return "Draw by insufficient material";
  if (chess.isDrawByFiftyMoves()) return "Draw by fifty-move rule";
  if (chess.isDraw()) return "Draw";
  if (chess.inCheck()) return chess.turn() === "w" ? "White is in check" : "Black is in check";
  return null;
}

export function pieceSrc(color: Color, type: PieceSymbol): string {
  return `/pieces/${color}${type.toUpperCase()}.svg`;
}

export function cpValue(score: Score): number {
  if (score.type === "mate") {
    if (score.value === 0) return 0;
    return score.value > 0 ? 100000 - score.value * 100 : -100000 - score.value * 100;
  }
  return score.value;
}

export function cloneChess(fen: string): Chess {
  return new Chess(fen, { skipValidation: false });
}
