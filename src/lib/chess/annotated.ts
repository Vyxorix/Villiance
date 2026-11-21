import { DEFAULT_POSITION } from "chess.js";
import type { Classification, Ply } from "./types";

const GLYPH: Partial<Record<Classification, string>> = {
  brilliant: "!!",
  inaccuracy: "?!",
  mistake: "?",
  blunder: "??",
};

const WORD: Partial<Record<Classification, string>> = {
  brilliant: "Brilliant",
  book: "Book",
  inaccuracy: "Inaccuracy",
  mistake: "Mistake",
  blunder: "Blunder",
};

function commentFor(ply: Ply): string {
  const bits: string[] = [];
  const word = ply.classification ? WORD[ply.classification] : undefined;
  if (word) bits.push(word);
  const wanted = ply.better?.san ?? (ply.coach && ply.coach.bestUci !== ply.uci ? ply.coach.bestSan : "");
  if (wanted && wanted !== ply.san) bits.push(`Engine wanted ${wanted}`);
  if (ply.better && ply.better.pvSan.length > 1) bits.push(ply.better.pvSan.slice(0, 6).join(" "));
  return bits.length ? ` {${bits.join(". ")}}` : "";
}

/** PGN with Villiance marks written in as comments. */
export function annotatedPgn(startFen: string, plies: Ply[]): string {
  const headers: string[] = [];
  if (startFen && startFen !== DEFAULT_POSITION) {
    headers.push('[SetUp "1"]', `[FEN "${startFen}"]`, "");
  }
  const moves = plies.map((ply, i) => {
    const prefix = i % 2 === 0 ? `${i / 2 + 1}. ` : "";
    const glyph = ply.classification ? (GLYPH[ply.classification] ?? "") : "";
    return `${prefix}${ply.san}${glyph}${commentFor(ply)}`;
  });
  return `${headers.join("\n")}${headers.length ? "\n" : ""}${moves.join(" ")}`.trim();
}
