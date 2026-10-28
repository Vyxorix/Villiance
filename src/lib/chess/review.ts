import type { Classification, Color, Ply, Score } from "./types";
import { evalToWhitePct } from "./helpers";

const ORDER: Classification[] = [
  "brilliant",
  "great",
  "best",
  "excellent",
  "good",
  "book",
  "inaccuracy",
  "mistake",
  "blunder",
];

export const REVIEW_ORDER = ORDER;

/**
 * One-move accuracy from the Lichess win-percent curve.
 * `before` and `after` are white's point of view. 100 means the mover
 * gave nothing away; a collapsed position falls toward 0.
 */
export function moveAccuracy(before: Score, after: Score, mover: Color): number {
  const whiteBefore = evalToWhitePct(before) * 100;
  const whiteAfter = evalToWhitePct(after) * 100;
  const playerBefore = mover === "w" ? whiteBefore : 100 - whiteBefore;
  const playerAfter = mover === "w" ? whiteAfter : 100 - whiteAfter;
  const diff = Math.max(0, playerBefore - playerAfter);
  const raw = 103.1668100711649 * Math.exp(-0.04354415386753951 * diff) - 3.166924740191411;
  return Math.min(100, Math.max(0, raw));
}

export type SideReview = {
  counts: Record<Classification, number>;
  accuracy: number | null;
  scored: number;
};

export type GameReview = {
  w: SideReview;
  b: SideReview;
  /** White win percent at the start and after every ply. Null until analyzed. */
  graph: (number | null)[];
  classified: number;
  scored: number;
  total: number;
};

function emptyCounts(): Record<Classification, number> {
  return {
    brilliant: 0,
    great: 0,
    best: 0,
    excellent: 0,
    good: 0,
    book: 0,
    inaccuracy: 0,
    mistake: 0,
    blunder: 0,
  };
}

export function summarizeReview(plies: Ply[], startEval: Score | null): GameReview {
  const w: SideReview = { counts: emptyCounts(), accuracy: null, scored: 0 };
  const b: SideReview = { counts: emptyCounts(), accuracy: null, scored: 0 };
  const sum = { w: 0, b: 0 };
  const graph: (number | null)[] = [startEval ? evalToWhitePct(startEval) * 100 : null];

  plies.forEach((ply, i) => {
    graph.push(ply.evalAfter ? evalToWhitePct(ply.evalAfter) * 100 : null);
    const side = i % 2 === 0 ? w : b;
    if (ply.classification) side.counts[ply.classification] += 1;
    const before = i === 0 ? startEval : plies[i - 1]?.evalAfter;
    if (!before || !ply.evalAfter) return;
    const acc = moveAccuracy(before, ply.evalAfter, i % 2 === 0 ? "w" : "b");
    sum[i % 2 === 0 ? "w" : "b"] += acc;
    side.scored += 1;
  });

  if (w.scored > 0) w.accuracy = sum.w / w.scored;
  if (b.scored > 0) b.accuracy = sum.b / b.scored;

  const classified = plies.filter((p) => p.classification).length;
  const scored = w.scored + b.scored;
  return { w, b, graph, classified, scored, total: plies.length };
}

export function reviewComplete(plies: Ply[], startEval: Score | null): boolean {
  if (plies.length === 0 || !startEval) return false;
  return plies.every((p) => p.classification && p.evalAfter);
}
