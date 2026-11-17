import { Chess, DEFAULT_POSITION, type PieceSymbol, type Square } from "chess.js";
import { uciParts, whiteScore } from "./helpers";
import { lichessJudgement } from "./lichess";
import type { CoachNote, Color, EngineLine, Score } from "./types";

export type { CoachNote };

export type ThreatArrow = { uci: string; san: string };

export type ClipboardMove = {
  san: string;
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
  uci: string;
};

export type ClipboardPlan =
  | { type: "ignore" }
  | { type: "already" }
  | { type: "fen"; fen: string }
  | { type: "moves"; goto: number | null; moves: ClipboardMove[] }
  | { type: "reset"; fen: string; moves: ClipboardMove[] };

const RESULT = /^(1-0|0-1|1\/2-1\/2|\*)$/;

export function coachFromLines(
  playedSan: string,
  playedUci: string,
  lines: EngineLine[],
  book: boolean,
): CoachNote {
  const best = lines[0];
  const bestUci = best?.pv[0] ?? "";
  const bestSan = best?.san[0] ?? "";
  const matched = bestUci ? lines.find((line) => line.pv[0] === playedUci) : undefined;
  let lossCp: number | null = null;
  let judgement: CoachNote["judgement"] = book ? "book" : null;

  if (best && matched) {
    if (best.score.type === "cp" && matched.score.type === "cp") {
      lossCp = best.score.value - matched.score.value;
    }
    const dropped = lichessJudgement(best.score, matched.score, "w");
    if (dropped) judgement = dropped;
    else if (playedUci === bestUci) judgement = book ? "book" : "best";
  } else if (best && playedUci === bestUci) {
    judgement = book ? "book" : "best";
    lossCp = 0;
  } else if (best && !book) {
    judgement = "miss";
  }

  return { playedSan, playedUci, bestSan, bestUci, lossCp, judgement };
}

/** Fill in the cost once the position after the move has an eval. Scores are White's. */
export function refineCoach(
  note: CoachNote,
  before: Score | null,
  after: Score | null,
  mover: Color,
): CoachNote {
  if (!before || !after) return note;
  if (note.bestUci && note.playedUci === note.bestUci) return note;
  const dropped = lichessJudgement(before, after, mover);
  let lossCp = note.lossCp;
  if (before.type === "cp" && after.type === "cp") {
    lossCp = mover === "w" ? before.value - after.value : after.value - before.value;
  }
  if (note.judgement === "book" && !dropped) return { ...note, lossCp };
  if (dropped) return { ...note, lossCp, judgement: dropped };
  return { ...note, lossCp };
}

export function formatLoss(cp: number | null): string | null {
  if (cp === null || cp < 20) return null;
  const pawns = cp / 100;
  return `−${pawns >= 10 ? pawns.toFixed(0) : pawns.toFixed(1)}`;
}

export function coachSentence(note: CoachNote): string {
  const you = `You played ${note.playedSan}.`;
  const same = Boolean(note.bestUci) && note.playedUci === note.bestUci;
  if (note.judgement === "book" && !same) return `${you} Book.`;
  if (same && note.judgement === "book") return `${you} Book, and the move.`;
  if (same || note.judgement === "best") return `${you} That's the move.`;
  const wanted = note.bestSan ? ` Engine wanted ${note.bestSan}.` : "";
  const word =
    note.judgement === "blunder"
      ? "Blunder"
      : note.judgement === "mistake"
        ? "Mistake"
        : note.judgement === "inaccuracy"
          ? "Inaccuracy"
          : null;
  const loss = formatLoss(note.lossCp);
  if (note.judgement === "miss") return note.bestSan ? `${you} Engine wanted ${note.bestSan}.` : you;
  if (word && loss) return `${you}${wanted} ${word}, ${loss}.`;
  if (word) return `${you}${wanted} ${word}.`;
  if (wanted) return `${you}${wanted} Close.`;
  return you;
}

/** Position after a pass. Illegal when the side to move is in check. */
export function nullMoveFen(fen: string): string | null {
  let chess: Chess;
  try {
    chess = new Chess(fen);
  } catch {
    return null;
  }
  if (chess.inCheck()) return null;
  const parts = chess.fen().split(" ");
  const passer = parts[1] === "w" ? "w" : "b";
  parts[1] = passer === "w" ? "b" : "w";
  parts[3] = "-";
  parts[4] = String(Number(parts[4] ?? "0") + 1);
  if (passer === "b") parts[5] = String(Number(parts[5] ?? "1") + 1);
  const next = parts.join(" ");
  try {
    return new Chess(next).fen();
  } catch {
    return null;
  }
}

export function threatMoveInfo(
  nullFen: string,
  uci: string,
): { san: string; capture: boolean; check: boolean } | null {
  try {
    const chess = new Chess(nullFen);
    const parts = uciParts(uci);
    const moved = chess.move({ from: parts.from, to: parts.to, promotion: parts.promotion });
    if (!moved) return null;
    return { san: moved.san, capture: Boolean(moved.isCapture()), check: chess.inCheck() };
  } catch {
    return null;
  }
}

/** How many centipawns the side to move loses by passing. */
export function passerLossCp(current: Score | null, threat: Score, passer: Color): number | null {
  const opponent = passer === "w" ? "b" : "w";
  const after = whiteScore(threat, opponent);
  if (after.type === "mate") {
    const matesPasser = opponent === "w" ? after.value > 0 : after.value < 0;
    return matesPasser ? 1000 : null;
  }
  if (!current || current.type !== "cp") return null;
  return current.value - after.value;
}

export function threatMatters(opts: { capture: boolean; check: boolean; lossForPasserCp: number | null }): boolean {
  if (opts.capture || opts.check) return true;
  return opts.lossForPasserCp !== null && opts.lossForPasserCp >= 100;
}

export function sanTokens(text: string): string[] {
  const cleaned = text.replace(/\{[^}]*\}/g, " ").replace(/\([^)]*\)/g, " ").replace(/\$\d+/g, " ");
  return cleaned
    .split(/\s+/)
    .map((token) => token.replace(/^\d+\.+/, "").replace(/[?!]+$/, ""))
    .filter((token) => token.length > 0 && !RESULT.test(token));
}

function posKey(fen: string): string {
  return fen.split(" ").slice(0, 4).join(" ");
}

function tryFen(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed.includes("/")) return null;
  try {
    return new Chess(trimmed).fen();
  } catch {
    return null;
  }
}

function fenHeader(text: string): string | null {
  const match = /\[FEN\s+"([^"]+)"\]/i.exec(text);
  if (!match) return null;
  return tryFen(match[1]);
}

function replay(fen: string, tokens: string[]): ClipboardMove[] | null {
  if (tokens.length === 0) return null;
  let chess: Chess;
  try {
    chess = new Chess(fen === DEFAULT_POSITION ? undefined : fen);
  } catch {
    return null;
  }
  const moves: ClipboardMove[] = [];
  for (const token of tokens) {
    const uciLike = /^[a-h][1-8][a-h][1-8][qrbn]?$/i.test(token);
    try {
      const moved = uciLike
        ? chess.move({
            from: token.slice(0, 2).toLowerCase() as Square,
            to: token.slice(2, 4).toLowerCase() as Square,
            promotion: (token[4]?.toLowerCase() as PieceSymbol | undefined) || undefined,
          })
        : chess.move(token);
      if (!moved) return null;
      moves.push({
        san: moved.san,
        from: moved.from,
        to: moved.to,
        promotion: moved.promotion,
        uci: `${moved.from}${moved.to}${moved.promotion ?? ""}`,
      });
    } catch {
      return null;
    }
  }
  return moves;
}

function prefixOf(moves: ClipboardMove[], plies: { san: string; uci: string }[]): boolean {
  return moves.slice(0, plies.length).every((move, i) => move.uci === plies[i].uci || move.san === plies[i].san);
}

/**
 * What to do with text copied from another chess app.
 * `replace` is the explicit Paste button. Watching the clipboard will not
 * start a different game over the one already on the board.
 */
export function planClipboard(
  text: string,
  ctx: { fen: string; startFen: string; plies: { san: string; uci: string }[]; cursor: number },
  replace: boolean,
): ClipboardPlan {
  const raw = text.trim();
  if (!raw || raw.length > 4000) return { type: "ignore" };

  const headerFen = fenHeader(raw);
  if (headerFen) {
    const tokens = sanTokens(raw.replace(/\[[^\]]+\]/g, " "));
    const moves = replay(headerFen, tokens) ?? [];
    if (!replace && ctx.plies.length > 0) return { type: "ignore" };
    if (moves.length === 0) return { type: "fen", fen: headerFen };
    return { type: "reset", fen: headerFen, moves };
  }

  const bareFen = tryFen(raw);
  if (bareFen) {
    if (posKey(bareFen) === posKey(ctx.fen)) return { type: "already" };
    return { type: "fen", fen: bareFen };
  }

  const tokens = sanTokens(raw);
  if (tokens.length === 0) return { type: "ignore" };
  const numbered = /\d+\./.test(raw);
  const fromHere = replay(ctx.fen, tokens);
  if (fromHere && !numbered) return { type: "moves", goto: null, moves: fromHere };

  const fromStart = replay(ctx.startFen || DEFAULT_POSITION, tokens);
  if (fromStart) {
    const continues =
      ctx.plies.length === 0 || (fromStart.length >= ctx.plies.length && prefixOf(fromStart, ctx.plies));
    if (continues && fromStart.length === ctx.plies.length) return { type: "already" };
    if (continues && fromStart.length > ctx.plies.length) {
      return {
        type: "moves",
        goto: ctx.cursor === ctx.plies.length ? null : ctx.plies.length,
        moves: fromStart.slice(ctx.plies.length),
      };
    }
    if (ctx.plies.length === 0 || replace) {
      return { type: "reset", fen: ctx.startFen || DEFAULT_POSITION, moves: fromStart };
    }
  }

  if (fromHere) return { type: "moves", goto: null, moves: fromHere };
  return { type: "ignore" };
}
