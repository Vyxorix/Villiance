import type { Classification, Color, Score } from "./types";

/**
 * Move judgment and accuracy from lichess-org/lila, used as published:
 * - ui/lib/src/ceval/winningChances.ts
 * - modules/tree/src/main/Advice.scala
 * - modules/analyse/src/main/AccuracyPercent.scala
 *
 * Winning chances are on [-1, 1]. A drop of 0.1 is an inaccuracy, 0.2 a
 * mistake, 0.3 a blunder. Anything smaller is not labeled.
 */

const MULTIPLIER = -0.00368208;

function rawWinningChances(cp: number): number {
  const chances = 2 / (1 + Math.exp(MULTIPLIER * cp)) - 1;
  return Math.min(1, Math.max(-1, chances));
}

export function cpWinningChances(cp: number): number {
  return rawWinningChances(Math.min(1000, Math.max(-1000, cp)));
}

function mateWinningChances(mate: number): number {
  if (mate === 0) return 0;
  const cp = (21 - Math.min(10, Math.abs(mate))) * 100;
  return rawWinningChances(cp * (mate > 0 ? 1 : -1));
}

/** White's winning chances in [-1, 1], matching Lichess evalWinningChances. */
export function evalWinningChances(score: Score): number {
  return score.type === "mate" ? mateWinningChances(score.value) : cpWinningChances(score.value);
}

/** Lichess win percent, 0 to 100. */
export function winPercent(score: Score): number {
  return 50 + 50 * evalWinningChances(score);
}

export type LichessJudgement = "inaccuracy" | "mistake" | "blunder";

function fromDrop(delta: number): LichessJudgement | null {
  if (delta >= 0.3) return "blunder";
  if (delta >= 0.2) return "mistake";
  if (delta >= 0.1) return "inaccuracy";
  return null;
}

/** Advice.scala MateAdvice, with both scores already from the mover's side. */
function mateJudgement(prev: Score, next: Score): LichessJudgement | null {
  const prevCp = prev.type === "cp" ? prev.value : 0;
  const nextCp = next.type === "cp" ? next.value : 0;
  const created = prev.type === "cp" && next.type === "mate" && next.value < 0;
  const lost =
    prev.type === "mate" && prev.value > 0 && (next.type === "cp" || (next.type === "mate" && next.value <= 0));
  if (created) {
    if (prevCp < -999) return "inaccuracy";
    if (prevCp < -700) return "mistake";
    return "blunder";
  }
  if (lost) {
    if (next.type === "cp" && nextCp > 999) return "inaccuracy";
    if (next.type === "cp" && nextCp > 700) return "mistake";
    return "blunder";
  }
  return null;
}

/**
 * Advice.scala. `before` and `after` are White's point of view.
 * Positive result means the mover gave chances away.
 */
export function lichessJudgement(before: Score, after: Score, mover: Color): LichessJudgement | null {
  if (before.type === "cp" && after.type === "cp") {
    const delta = evalWinningChances(after) - evalWinningChances(before);
    return fromDrop(mover === "w" ? -delta : delta);
  }
  const flip = (score: Score): Score => (mover === "w" ? score : { type: score.type, value: -score.value });
  return mateJudgement(flip(before), flip(after));
}

/** AccuracyPercent.fromWinPercents. Win percents are the mover's, 0 to 100. */
export function accuracyFromWinPercents(before: number, after: number): number {
  if (after >= before) return 100;
  const raw = 103.1668100711649 * Math.exp(-0.04354415386753951 * (before - after)) - 3.166924740191411;
  return Math.min(100, Math.max(0, raw + 1));
}

function stddev(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, n) => sum + n, 0) / values.length;
  return Math.sqrt(values.reduce((sum, n) => sum + (n - mean) ** 2, 0) / values.length);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/**
 * AccuracyPercent.gameAccuracy: the mean of a volatility-weighted mean and a
 * harmonic mean. `points` is White's win percent at the start and after each ply.
 */
export function gameAccuracy(
  points: (number | null)[],
  startWhite = true,
): { w: number | null; b: number | null } {
  const n = points.length;
  if (n < 2) return { w: null, b: null };
  const windowSize = clamp(Math.floor((n - 1) / 10), 2, 8);
  const sliding: (number | null)[][] = [];
  if (windowSize >= n) sliding.push(points.slice());
  else for (let i = 0; i + windowSize <= n; i++) sliding.push(points.slice(i, i + windowSize));
  const fill = Math.max(0, Math.min(windowSize, n) - 2);
  const windows = [...Array.from({ length: fill }, () => points.slice(0, windowSize)), ...sliding];
  const weights = windows.map((window) => {
    if (window.some((point) => point === null)) return null;
    const spread = stddev(window as number[]);
    return spread === 0 ? 0.5 : clamp(spread, 0.5, 12);
  });

  const rows: { color: Color; accuracy: number; weight: number }[] = [];
  for (let i = 0; i < n - 1; i++) {
    const prev = points[i];
    const next = points[i + 1];
    const weight = weights[i];
    if (prev === null || next === null || weight === null || weight === undefined) continue;
    const whiteMoved = (i % 2 === 0) === startWhite;
    const color: Color = whiteMoved ? "w" : "b";
    const before = whiteMoved ? prev : 100 - prev;
    const after = whiteMoved ? next : 100 - next;
    rows.push({ color, accuracy: accuracyFromWinPercents(before, after), weight });
  }

  const side = (color: Color): number | null => {
    const mine = rows.filter((row) => row.color === color);
    if (mine.length === 0) return null;
    const weightSum = mine.reduce((sum, row) => sum + row.weight, 0);
    const weighted = mine.reduce((sum, row) => sum + row.accuracy * row.weight, 0) / weightSum;
    const harmonic = mine.length / mine.reduce((sum, row) => sum + 1 / Math.max(row.accuracy, 1e-6), 0);
    return (weighted + harmonic) / 2;
  };
  return { w: side("w"), b: side("b") };
}

/** A played move's label. Null means Lichess would show no glyph. */
export function lichessLabel(opts: {
  book: boolean;
  before: Score;
  after: Score;
  mover: Color;
  brilliant?: boolean;
}): Classification | undefined {
  const judgement = lichessJudgement(opts.before, opts.after, opts.mover);
  if (judgement) return judgement;
  if (opts.brilliant) return "brilliant";
  if (opts.book) return "book";
  return undefined;
}
