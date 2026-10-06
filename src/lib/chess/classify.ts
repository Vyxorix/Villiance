import { Chess } from "chess.js";
import type { BrilliantHint, Classification, EngineLine, Score } from "./types";
import { cpValue, destAttacked, opposite, PIECE_VAL, uciParts, whiteScore } from "./helpers";

function moverCp(score: Score): number {
  return cpValue(score);
}

export function classifyMove(
  best: Score | null,
  played: Score | null,
  opts: { sacrifice: boolean; book: boolean; onlyMove: boolean },
): Classification {
  if (opts.book && !opts.sacrifice) return "book";
  if (!best || !played) return "good";
  const loss = moverCp(best) - moverCp(played);
  const playedWinning =
    (played.type === "mate" && played.value > 0) || (played.type === "cp" && played.value >= 80);
  if (opts.sacrifice && loss <= 30 && playedWinning) return "brilliant";
  if (opts.onlyMove && loss <= 25) return "great";
  if (loss <= 8) return "best";
  if (loss <= 25) return "excellent";
  if (loss <= 55) return "good";
  if (loss <= 110) return "inaccuracy";
  if (loss <= 280) return "mistake";
  return "blunder";
}

export function detectSacrifice(fen: string, uci: string): { pawns: number; hanging: boolean } {
  const chess = new Chess(fen);
  const { from, to, promotion } = uciParts(uci);
  const piece = chess.get(from);
  if (!piece) return { pawns: 0, hanging: false };
  const captured = chess.get(to);
  const give = PIECE_VAL[piece.type] - (captured ? PIECE_VAL[captured.type] : 0);
  try {
    chess.move({ from, to, promotion });
  } catch {
    return { pawns: 0, hanging: false };
  }
  const hanging = destAttacked(chess, to, opposite(piece.color));
  const pawns = give > 0 && hanging ? give : give >= 3 ? give : 0;
  return { pawns, hanging: hanging && give > 0 };
}

export function pickBrilliant(
  fen: string,
  lines: EngineLine[],
): BrilliantHint | null {
  if (lines.length === 0) return null;
  const best = lines[0];
  const bestCp = moverCp(best.score);
  let winner: { line: EngineLine; score: number; sac: number; reason: string } | null = null;

  for (const line of lines) {
    const uci = line.pv[0];
    if (!uci) continue;
    const gap = bestCp - moverCp(line.score);
    if (gap > 90 && !(line.score.type === "mate" && line.score.value > 0)) continue;
    const sac = detectSacrifice(fen, uci);
    const chess = new Chess(fen);
    let check = false;
    let replies = 30;
    try {
      const mv = chess.move(uciParts(uci));
      check = Boolean(mv?.san.includes("+") || mv?.san.includes("#"));
      replies = chess.moves().length;
    } catch {
      continue;
    }
    const mate = line.score.type === "mate" && line.score.value > 0;
    let pts = 0;
    let reason = "Best engine continuation";
    if (mate) {
      pts += 900 - line.score.value * 12;
      reason = line.score.value <= 2 ? "Forces checkmate" : `Mate in ${line.score.value}`;
    }
    if (sac.pawns >= 1) {
      pts += 70 + sac.pawns * 45;
      reason = mate
        ? "Sacrificial mate"
        : sac.pawns >= 5
          ? "Queen sacrifice that holds"
          : "Material offer that keeps the attack";
    }
    if (check) pts += 28;
    if (replies <= 3) {
      pts += 40;
      if (!sac.pawns) reason = "Forcing — few legal replies";
    }
    if (gap <= 25) pts += 18;
    else pts -= gap * 0.4;
    if (!winner || pts > winner.score) winner = { line, score: pts, sac: sac.pawns, reason };
  }

  if (!winner) {
    const line = best;
    const uci = line.pv[0];
    if (!uci) return null;
    return {
      uci,
      san: line.san[0] ?? uci,
      reason: "Best engine continuation",
      pvSan: line.san,
      score: line.score,
      sacrifice: false,
      mate: line.score.type === "mate" && line.score.value > 0,
    };
  }

  const line = winner.line;
  const uci = line.pv[0]!;
  const brilliantish = winner.sac >= 1 || (line.score.type === "mate" && line.score.value > 0);
  return {
    uci,
    san: line.san[0] ?? uci,
    reason: winner.reason,
    pvSan: line.san,
    score: line.score,
    sacrifice: winner.sac >= 1,
    mate: line.score.type === "mate" && line.score.value > 0 && brilliantish ? true : line.score.type === "mate" && line.score.value > 0,
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
  const match = lines.find((l) => l.pv[0] === playedUci);
  const sac = detectSacrifice(fen, playedUci).pawns >= 1;
  const onlyMove =
    lines.length > 1 && moverCp(best.score) - moverCp(lines[1].score) >= 140;
  const played = match?.score ?? null;
  return classifyMove(best.score, played, { sacrifice: sac, book, onlyMove });
}

export function toWhiteEval(score: Score, turn: "w" | "b"): Score {
  return whiteScore(score, turn);
}
