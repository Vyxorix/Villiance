import { Chess, type Color, type PieceSymbol, type Square } from "chess.js";
import type { BrilliantHint, Classification, EngineLine, Score } from "./types";
import { cpValue, uciParts } from "./helpers";

const VAL: Record<PieceSymbol, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

function moverCp(score: Score): number {
  return cpValue(score);
}

function material(chess: Chess, color: Color): number {
  let total = 0;
  for (const row of chess.board()) {
    for (const piece of row) {
      if (!piece || piece.type === "k") continue;
      const value = VAL[piece.type];
      total += piece.color === color ? value : -value;
    }
  }
  return total;
}

function cheapestCapture(chess: Chess, square: Square) {
  const moves = chess
    .moves({ verbose: true })
    .filter((move) => move.to === square && move.captured);
  if (moves.length === 0) return null;
  moves.sort((a, b) => {
    const av = VAL[chess.get(a.from)?.type ?? "q"];
    const bv = VAL[chess.get(b.from)?.type ?? "q"];
    return av - bv;
  });
  return moves[0] ?? null;
}

/** Material for `mover` after optimal captures on one square. */
function afterExchanges(chess: Chess, square: Square, mover: Color, depth = 0): number {
  const stand = material(chess, mover);
  if (depth > 8) return stand;
  const cap = cheapestCapture(chess, square);
  if (!cap) return stand;
  const next = new Chess(chess.fen());
  try {
    next.move({ from: cap.from, to: cap.to, promotion: cap.promotion });
  } catch {
    return stand;
  }
  const continued = afterExchanges(next, square, mover, depth + 1);
  return chess.turn() === mover ? Math.max(stand, continued) : Math.min(stand, continued);
}

/** Material for `mover` if the side to move takes its best capture, or stands pat. */
function bestReplyMaterial(chess: Chess, mover: Color): number {
  const stand = material(chess, mover);
  if (chess.turn() === mover) return stand;
  let best = stand;
  const seen = new Set<string>();
  for (const cap of chess.moves({ verbose: true })) {
    if (!cap.captured) continue;
    const key = `${cap.from}${cap.to}${cap.promotion ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const next = new Chess(chess.fen());
    try {
      next.move({ from: cap.from, to: cap.to, promotion: cap.promotion });
    } catch {
      continue;
    }
    const after = afterExchanges(next, cap.to, mover);
    if (after < best) best = after;
  }
  return best;
}

/** Centipawns the mover newly gives away, after the opponent's best capture. */
export function sacrificeCentipawns(fen: string, uci: string): number {
  const before = new Chess(fen);
  const { from, to, promotion } = uciParts(uci);
  const piece = before.get(from);
  if (!piece) return 0;
  const mover = piece.color;
  const startMaterial = material(before, mover);
  try {
    const played = before.move({ from, to, promotion });
    if (!played) return 0;
  } catch {
    return 0;
  }
  return Math.max(0, startMaterial - bestReplyMaterial(before, mover));
}

function isRealSacrifice(fen: string, uci: string): boolean {
  return sacrificeCentipawns(fen, uci) >= 200;
}

function keepsAdvantage(score: Score): boolean {
  if (score.type === "mate") return score.value > 0 && score.value <= 6;
  return score.value >= 150;
}

export function classifyMove(
  best: Score | null,
  played: Score | null,
  opts: { sacrifice: boolean; book: boolean; onlyMove: boolean; depth: number },
): Classification {
  if (opts.book && !opts.sacrifice) return "book";
  if (!best || !played) return opts.sacrifice ? "blunder" : "good";
  const loss = moverCp(best) - moverCp(played);
  const shortMate = played.type === "mate" && played.value > 0 && played.value <= 4;
  if (
    opts.sacrifice &&
    opts.depth >= 10 &&
    loss <= 12 &&
    (shortMate || keepsAdvantage(played))
  ) {
    return "brilliant";
  }
  if (opts.onlyMove && loss <= 20) return "great";
  if (loss <= 8) return "best";
  if (loss <= 25) return "excellent";
  if (loss <= 55) return "good";
  if (loss <= 110) return "inaccuracy";
  if (loss <= 280) return "mistake";
  return "blunder";
}

export function pickBrilliant(fen: string, lines: EngineLine[]): BrilliantHint | null {
  const line = lines[0];
  const uci = line?.pv[0];
  if (!line || !uci) return null;

  const sac = isRealSacrifice(fen, uci);
  const mate = line.score.type === "mate" && line.score.value > 0;
  const shortMate = mate && line.score.value <= 4;
  const brilliant = sac && line.depth >= 10 && (shortMate || keepsAdvantage(line.score));

  let reason = "Best continuation";
  if (brilliant && mate) reason = "Sacrifice forces mate";
  else if (brilliant) reason = "Sound sacrifice — the attack stays winning";
  else if (shortMate) reason = `Forces mate in ${line.score.value}`;
  else if (mate) reason = `Mate in ${line.score.value}`;

  return {
    uci,
    san: line.san[0] ?? uci,
    reason,
    pvSan: line.san,
    score: line.score,
    sacrifice: brilliant,
    mate: brilliant && mate,
  };
}

export function classifyFromLines(
  fen: string,
  playedUci: string,
  lines: EngineLine[],
  book: boolean,
): Classification {
  if (lines.length === 0) return book ? "book" : "good";
  const best = lines[0];
  if (!best) return book ? "book" : "good";
  const match = lines.find((line) => line.pv[0] === playedUci);
  const sacrifice = isRealSacrifice(fen, playedUci);
  const onlyMove = lines.length > 1 && moverCp(best.score) - moverCp(lines[1]!.score) >= 180;
  if (!match) {
    if (book && !sacrifice) return "book";
    if (sacrifice) return "blunder";
    return best.depth >= 10 ? "mistake" : "good";
  }
  return classifyMove(best.score, match.score, {
    sacrifice,
    book,
    onlyMove,
    depth: match.depth,
  });
}
