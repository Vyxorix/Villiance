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

/**
 * A brilliant label needs three things at once: the move is essentially best,
 * the search is deep enough that the score is stable, and there is a specific
 * reason it is exceptional. Thresholds are in centipawns from the side to move.
 *
 * - minSacCp: net material the mover is still down after the opponent's best
 *   captures. 150 covers a minor piece or a sound exchange sacrifice, not a pawn.
 * - maxLossCp: how far behind the engine's best the played move may be.
 * - sacDepth / mateSacDepth: shallow mate scores flicker; a forced mate may
 *   qualify a little earlier than a positional sacrifice.
 * - sacGap: another try must be clearly worse, unless the move is mate on the board.
 * - quietGap / quietMinCp: a non-capture is brilliant only when it creates the
 *   advantage. If the alternative is also winning, it is just a good move.
 * - defenseMaxCp / defenseAltCp: the move holds a roughly level position while
 *   the alternative loses. Already-won positions do not qualify.
 */
export const BRILLIANT = {
  minSacCp: 150,
  maxLossCp: 15,
  sacDepth: 10,
  mateSacDepth: 8,
  sacGap: 60,
  shortMate: 4,
  winningCp: 120,
  holdCp: -40,
  quietDepth: 12,
  quietGap: 180,
  quietMinCp: 100,
  quietAltMaxCp: 40,
  defenseDepth: 11,
  defenseGap: 260,
  defenseMaxCp: 70,
  defenseAltCp: -280,
  obviousGainCp: 180,
} as const;

export type BrilliantKind = "sacrifice" | "quiet" | "defense" | null;

export type BrilliantEvidence = {
  brilliant: boolean;
  sacrifice: boolean;
  mate: boolean;
  kind: BrilliantKind;
  reason: string;
  confidence: "high" | "medium" | "low";
  /** Set when a move was a candidate and then rejected. Useful in tests. */
  rejected?: string;
};

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

/** Material the mover gains on the spot, before the opponent replies. */
export function immediateGain(fen: string, uci: string): number {
  const before = new Chess(fen);
  const { from, to, promotion } = uciParts(uci);
  const piece = before.get(from);
  if (!piece) return 0;
  const start = material(before, piece.color);
  try {
    const played = before.move({ from, to, promotion });
    if (!played) return 0;
  } catch {
    return 0;
  }
  return material(before, piece.color) - start;
}

function moveInfo(fen: string, uci: string): { legal: number; capture: boolean; check: boolean; mate: boolean } | null {
  const chess = new Chess(fen);
  const legal = chess.moves().length;
  const { from, to, promotion } = uciParts(uci);
  try {
    const played = chess.move({ from, to, promotion });
    if (!played) return null;
  } catch {
    return null;
  }
  return {
    legal,
    capture: Boolean(chess.history({ verbose: true }).at(-1)?.captured),
    check: chess.inCheck(),
    mate: chess.isCheckmate(),
  };
}

function shortMate(score: Score, max = BRILLIANT.shortMate): boolean {
  return score.type === "mate" && score.value > 0 && score.value <= max;
}

function emptyEvidence(partial: Partial<BrilliantEvidence> = {}): BrilliantEvidence {
  return {
    brilliant: false,
    sacrifice: false,
    mate: false,
    kind: null,
    reason: "Best continuation",
    confidence: "low",
    ...partial,
  };
}

/**
 * Decide whether one candidate, already present in a MultiPV search, is brilliant.
 * Book moves stay book: theory is expected, not a find. A single principal
 * variation is not enough for a quiet or defensive claim, because we cannot
 * see that the alternatives fail.
 */
export function assessBrilliant(
  fen: string,
  uci: string,
  lines: EngineLine[],
  opts: { book: boolean },
): BrilliantEvidence {
  const best = lines[0];
  const sacCp = sacrificeCentipawns(fen, uci);
  const sacrifice = sacCp >= BRILLIANT.minSacCp;
  const info = moveInfo(fen, uci);
  if (!best?.pv[0] || !info) return emptyEvidence({ sacrifice });

  const playedLine = lines.find((line) => line.pv[0] === uci);
  const score = playedLine?.score;
  const mate = Boolean(info.mate || (score && score.type === "mate" && score.value > 0));
  const base = emptyEvidence({ sacrifice, mate });
  if (opts.book) return { ...base, rejected: "book" };
  if (!playedLine || !score) return { ...base, rejected: "unlisted" };

  const loss = cpValue(best.score) - cpValue(score);
  if (loss > BRILLIANT.maxLossCp) return { ...base, rejected: "not-best" };

  const alt = lines.find((line) => line.pv[0] !== uci) ?? null;
  const altCp = alt ? cpValue(alt.score) : null;
  const playedCp = cpValue(score);
  const gap = altCp === null ? null : playedCp - altCp;
  const depth = playedLine.depth;
  const gain = immediateGain(fen, uci);
  const forcedMate = shortMate(score) || info.mate;
  const altAlsoMates =
    Boolean(alt && score.type === "mate" && alt.score.type === "mate" && alt.score.value > 0 && alt.score.value <= score.value + 1);

  if (info.mate && sacrifice && info.legal > 1) {
    return {
      brilliant: true,
      sacrifice: true,
      mate: true,
      kind: "sacrifice",
      reason: "Sacrifice delivers mate",
      confidence: "high",
    };
  }

  if (sacrifice) {
    const deepEnough = depth >= (forcedMate ? BRILLIANT.mateSacDepth : BRILLIANT.sacDepth);
    if (!deepEnough) return { ...base, rejected: "shallow" };
    if (info.legal < 2) return { ...base, rejected: "only-legal" };
    const winning = forcedMate || playedCp >= BRILLIANT.winningCp;
    const saving = playedCp >= BRILLIANT.holdCp && altCp !== null && altCp <= -200 && (gap ?? 0) >= 200;
    if (!winning && !saving) return { ...base, rejected: "unsound" };
    if (altAlsoMates) return { ...base, rejected: "several-mates" };
    if (gap === null) return { ...base, rejected: "no-alternative" };
    if (winning && !forcedMate && gap < BRILLIANT.sacGap) return { ...base, rejected: "close-alternative" };
    if (!winning && gap < 200) return { ...base, rejected: "close-alternative" };
    const defensive = saving && !winning;
    return {
      brilliant: true,
      sacrifice: true,
      mate: forcedMate,
      kind: defensive ? "defense" : "sacrifice",
      reason: forcedMate
        ? "Sacrifice forces mate"
        : defensive
          ? "Sacrifice holds a lost position"
          : "Sound sacrifice — compensation holds",
      confidence: depth >= BRILLIANT.sacDepth + 2 || forcedMate ? "high" : "medium",
    };
  }

  if (gap === null || altCp === null || !alt) return { ...base, rejected: "no-alternative" };
  if (info.legal < 2) return { ...base, rejected: "only-legal" };
  if (gain >= BRILLIANT.obviousGainCp) return { ...base, rejected: "obvious-capture" };

  const quietMate = score.type === "mate" && score.value > 0 && score.value <= 5 && !info.capture && !altAlsoMates;
  if (
    !info.capture &&
    depth >= BRILLIANT.quietDepth &&
    gap >= BRILLIANT.quietGap &&
    (quietMate || (playedCp >= BRILLIANT.quietMinCp && altCp <= BRILLIANT.quietAltMaxCp))
  ) {
    return {
      brilliant: true,
      sacrifice: false,
      mate: quietMate,
      kind: "quiet",
      reason: quietMate ? "Quiet move forces mate" : "Quiet move — the alternatives collapse",
      confidence: depth >= BRILLIANT.quietDepth + 2 ? "high" : "medium",
    };
  }

  if (
    depth >= BRILLIANT.defenseDepth &&
    playedCp >= BRILLIANT.holdCp &&
    playedCp <= BRILLIANT.defenseMaxCp &&
    altCp <= BRILLIANT.defenseAltCp &&
    gap >= BRILLIANT.defenseGap
  ) {
    return {
      brilliant: true,
      sacrifice: false,
      mate: false,
      kind: "defense",
      reason: info.check ? "This check is the save" : "Only this idea holds the position",
      confidence: depth >= BRILLIANT.defenseDepth + 2 ? "high" : "medium",
    };
  }

  return { ...base, rejected: "ordinary" };
}

/** A sacrifice looks promising but the first search was too shallow to trust. */
export function needsDeeperCheck(fen: string, lines: EngineLine[]): boolean {
  const uci = lines[0]?.pv[0];
  if (!uci) return false;
  return assessBrilliant(fen, uci, lines, { book: false }).rejected === "shallow";
}

export function classifyMove(
  best: Score | null,
  played: Score | null,
  opts: { book: boolean; onlyMove: boolean },
): Classification {
  if (opts.book) return "book";
  if (!best || !played) return "good";
  const loss = cpValue(best) - cpValue(played);
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
  const verdict = assessBrilliant(fen, uci, lines, { book: false });
  let reason = "Best continuation";
  if (verdict.brilliant) reason = verdict.reason;
  else if (line.score.type === "mate" && line.score.value > 0) reason = `Mate in ${line.score.value}`;
  return {
    uci,
    san: line.san[0] ?? uci,
    reason,
    pvSan: line.san,
    score: line.score,
    sacrifice: verdict.sacrifice,
    mate: verdict.brilliant && verdict.mate,
    brilliant: verdict.brilliant,
    confidence: verdict.confidence,
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
  if (book) return "book";
  const verdict = assessBrilliant(fen, playedUci, lines, { book: false });
  if (verdict.brilliant) return "brilliant";
  const match = lines.find((line) => line.pv[0] === playedUci);
  const sacrifice = sacrificeCentipawns(fen, playedUci) >= BRILLIANT.minSacCp;
  const onlyMove = lines.length > 1 && best.pv[0] === playedUci && cpValue(best.score) - cpValue(lines[1]!.score) >= 180;
  if (!match) {
    if (best.depth < 8) return "good";
    return sacrifice || best.depth >= 10 ? "mistake" : "good";
  }
  return classifyMove(best.score, match.score, { book: false, onlyMove });
}
