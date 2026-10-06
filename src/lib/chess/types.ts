import type { Color, PieceSymbol, Square } from "chess.js";

export type { Color, PieceSymbol, Square };

export type GameMode = "play" | "analyze" | "study";

export type Classification =
  | "brilliant"
  | "great"
  | "best"
  | "excellent"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "blunder";

export type Score = { type: "cp" | "mate"; value: number };

export type EngineLine = {
  multipv: number;
  depth: number;
  score: Score;
  pv: string[];
  san: string[];
};

export type Ply = {
  san: string;
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
  uci: string;
  fenAfter: string;
  classification?: Classification;
  evalAfter?: Score;
};

export type BrilliantHint = {
  uci: string;
  san: string;
  reason: string;
  pvSan: string[];
  score: Score;
  sacrifice: boolean;
  mate: boolean;
};

export type Study = {
  id: string;
  title: string;
  source: string;
  fen: string;
  solution: string;
  idea: string;
};

export type PromotionPiece = Extract<PieceSymbol, "q" | "r" | "b" | "n">;
