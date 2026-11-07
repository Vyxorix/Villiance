import type { Classification, Color, Ply, Score } from "./types";
import { evalToWhitePct } from "./helpers";
import { accuracyFromWinPercents, gameAccuracy, winPercent } from "./lichess";

const ORDER: Classification[] = ["brilliant", "book", "inaccuracy", "mistake", "blunder"];

export const REVIEW_ORDER = ORDER;

/**
 * One-move accuracy from Lichess AccuracyPercent.fromWinPercents.
 * Equal or better chances score 100. The published curve includes the +1
 * uncertainty bonus.
 */
export function moveAccuracy(before: Score, after: Score, mover: Color): number {
  const whiteBefore = winPercent(before);
  const whiteAfter = winPercent(after);
  const playerBefore = mover === "w" ? whiteBefore : 100 - whiteBefore;
  const playerAfter = mover === "w" ? whiteAfter : 100 - whiteAfter;
  return accuracyFromWinPercents(playerBefore, playerAfter);
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
  const graph: (number | null)[] = [startEval ? evalToWhitePct(startEval) * 100 : null];

  plies.forEach((ply, i) => {
    graph.push(ply.evalAfter ? evalToWhitePct(ply.evalAfter) * 100 : null);
    const side = i % 2 === 0 ? w : b;
    if (ply.classification && ply.classification in side.counts) side.counts[ply.classification] += 1;
    if (ply.evalAfter && (i === 0 ? startEval : plies[i - 1]?.evalAfter)) side.scored += 1;
  });

  const accuracy = gameAccuracy(graph);
  w.accuracy = accuracy.w;
  b.accuracy = accuracy.b;

  const classified = plies.filter((p) => p.classification).length;
  const scored = w.scored + b.scored;
  return { w, b, graph, classified, scored, total: plies.length };
}

export function reviewComplete(plies: Ply[], startEval: Score | null): boolean {
  if (plies.length === 0 || !startEval) return false;
  return plies.every((p) => p.evalAfter);
}
