import { useMemo } from "react";
import { Chess, DEFAULT_POSITION, type Square } from "chess.js";
import { create } from "zustand";
import { classifyFromLines, pickBrilliant } from "@/lib/chess/classify";
import type { AnalyzeResult } from "@/lib/chess/engine";
import { kingSquare, statusText, toUci, uciParts } from "@/lib/chess/helpers";
import { isBookMove, openingName } from "@/lib/chess/openings";
import { loadPersist, savePersist } from "@/lib/chess/persist";
import { playMoveSound, resumeAudio } from "@/lib/chess/sound";
import { STUDIES } from "@/lib/chess/studies";
import type {
  BrilliantHint,
  Color,
  EngineLine,
  GameMode,
  PieceSymbol,
  Ply,
  PromotionPiece,
  Score,
  Square as Sq,
} from "@/lib/chess/types";

export type PendingPromotion = { from: Sq; to: Sq };

type GameState = {
  startFen: string;
  plies: Ply[];
  cursor: number;
  orientation: Color;
  mode: GameMode;
  playerColor: Color;
  selected: Sq | null;
  dests: Sq[];
  pendingPromotion: PendingPromotion | null;
  engineOn: boolean;
  engineReady: boolean;
  thinking: boolean;
  lines: EngineLine[];
  evalScore: Score | null;
  brilliant: BrilliantHint | null;
  movetime: number;
  showCoords: boolean;
  sound: boolean;
  lastMove: { from: Sq; to: Sq } | null;
  opening: string | null;
  studyId: string | null;
  studySolved: boolean;
  studyMiss: boolean;
  importOpen: boolean;
  hoverDest: Sq | null;
  dragging: Sq | null;
};

type GameActions = {
  hydrate: () => void;
  persistNow: () => void;
  chess: () => Chess;
  fen: () => string;
  turn: () => Color;
  newGame: (opts?: { color?: Color; mode?: GameMode; fen?: string }) => void;
  loadPgn: (pgn: string) => string | null;
  loadFen: (fen: string) => string | null;
  loadStudy: (id: string) => void;
  selectSquare: (sq: Sq) => void;
  tryMove: (from: Sq, to: Sq, promotion?: PieceSymbol) => boolean;
  choosePromotion: (piece: PromotionPiece) => void;
  cancelPromotion: () => void;
  goto: (cursor: number) => void;
  flip: () => void;
  takeback: () => void;
  playHint: () => void;
  setMode: (mode: GameMode) => void;
  setEngineOn: (on: boolean) => void;
  setMovetime: (ms: number) => void;
  setSound: (on: boolean) => void;
  setShowCoords: (on: boolean) => void;
  setEngineReady: (on: boolean) => void;
  applyAnalysis: (result: AnalyzeResult, fen: string) => void;
  setThinking: (on: boolean) => void;
  setImportOpen: (on: boolean) => void;
  setHoverDest: (sq: Sq | null) => void;
  setDragging: (sq: Sq | null) => void;
  canMove: (color: Color) => boolean;
  pgn: () => string;
};

function chessAt(startFen: string, plies: Ply[], cursor: number): Chess {
  const c = new Chess(startFen === DEFAULT_POSITION || !startFen ? undefined : startFen);
  for (let i = 0; i < cursor; i++) {
    const p = plies[i];
    c.move({ from: p.from, to: p.to, promotion: p.promotion });
  }
  return c;
}

function destsFor(chess: Chess, sq: Sq): Sq[] {
  return chess.moves({ square: sq, verbose: true }).map((m) => m.to);
}

function lastFromPlies(plies: Ply[], cursor: number) {
  if (cursor <= 0) return null;
  const p = plies[cursor - 1];
  return { from: p.from, to: p.to };
}

const initial: GameState = {
  startFen: DEFAULT_POSITION,
  plies: [],
  cursor: 0,
  orientation: "w",
  mode: "play",
  playerColor: "w",
  selected: null,
  dests: [],
  pendingPromotion: null,
  engineOn: true,
  engineReady: false,
  thinking: false,
  lines: [],
  evalScore: null,
  brilliant: null,
  movetime: 350,
  showCoords: true,
  sound: true,
  lastMove: null,
  opening: "Starting position",
  studyId: null,
  studySolved: false,
  studyMiss: false,
  importOpen: false,
  hoverDest: null,
  dragging: null,
};

export const useGame = create<GameState & GameActions>((set, get) => ({
  ...initial,

  hydrate: () => {
    const saved = loadPersist();
    if (!saved.pgn && !saved.startFen) {
      set({
        movetime: saved.movetime,
        sound: saved.sound,
        showCoords: saved.showCoords,
        engineOn: saved.engineOn,
      });
      return;
    }
    try {
      const chess = new Chess(saved.startFen || undefined);
      if (saved.pgn) chess.loadPgn(saved.pgn);
      const verbose = chess.history({ verbose: true });
      const startFen = saved.startFen || DEFAULT_POSITION;
      const rebuilt = new Chess(startFen === DEFAULT_POSITION ? undefined : startFen);
      const plies: Ply[] = verbose.map((m) => {
        rebuilt.move({ from: m.from, to: m.to, promotion: m.promotion });
        return {
          san: m.san,
          from: m.from,
          to: m.to,
          promotion: m.promotion,
          uci: toUci(m.from, m.to, m.promotion),
          fenAfter: rebuilt.fen(),
        };
      });
      const cursor = Math.min(saved.cursor, plies.length);
      set({
        startFen,
        plies,
        cursor,
        orientation: saved.orientation,
        playerColor: saved.playerColor,
        mode: saved.mode === "study" ? "analyze" : saved.mode,
        engineOn: saved.engineOn,
        movetime: saved.movetime,
        sound: saved.sound,
        showCoords: saved.showCoords,
        lastMove: lastFromPlies(plies, cursor),
        opening: openingName(plies.slice(0, cursor).map((p) => p.san)),
        selected: null,
        dests: [],
      });
    } catch {
      set({ movetime: saved.movetime, sound: saved.sound, showCoords: saved.showCoords });
    }
  },

  persistNow: () => {
    const s = get();
    savePersist({
      version: 1,
      pgn: s.pgn(),
      startFen: s.startFen === DEFAULT_POSITION ? "" : s.startFen,
      cursor: s.cursor,
      orientation: s.orientation,
      playerColor: s.playerColor,
      mode: s.mode,
      engineOn: s.engineOn,
      movetime: s.movetime,
      sound: s.sound,
      showCoords: s.showCoords,
    });
  },

  chess: () => chessAt(get().startFen, get().plies, get().cursor),
  fen: () => get().chess().fen(),
  turn: () => get().chess().turn(),
  pgn: () => {
    const s = get();
    const c = chessAt(s.startFen, s.plies, s.plies.length);
    return c.pgn();
  },

  canMove: (color) => {
    const s = get();
    const chess = s.chess();
    if (chess.isGameOver()) return false;
    if (chess.turn() !== color) return false;
    if (s.mode === "analyze" || s.mode === "study") return true;
    return color === s.playerColor;
  },

  newGame: (opts = {}) => {
    const color = opts.color ?? "w";
    const mode = opts.mode ?? "play";
    const fen = opts.fen || DEFAULT_POSITION;
    set({
      startFen: fen,
      plies: [],
      cursor: 0,
      orientation: color,
      playerColor: color,
      mode,
      selected: null,
      dests: [],
      pendingPromotion: null,
      lines: [],
      evalScore: null,
      brilliant: null,
      lastMove: null,
      opening: "Starting position",
      studyId: null,
      studySolved: false,
      studyMiss: false,
      hoverDest: null,
      dragging: null,
    });
    get().persistNow();
  },

  loadPgn: (pgn) => {
    try {
      const chess = new Chess();
      chess.loadPgn(pgn);
      const verbose = chess.history({ verbose: true });
      const rebuilt = new Chess();
      const plies: Ply[] = verbose.map((m) => {
        rebuilt.move({ from: m.from, to: m.to, promotion: m.promotion });
        return {
          san: m.san,
          from: m.from,
          to: m.to,
          promotion: m.promotion,
          uci: toUci(m.from, m.to, m.promotion),
          fenAfter: rebuilt.fen(),
        };
      });
      set({
        startFen: DEFAULT_POSITION,
        plies,
        cursor: plies.length,
        mode: "analyze",
        selected: null,
        dests: [],
        pendingPromotion: null,
        lastMove: lastFromPlies(plies, plies.length),
        opening: openingName(plies.map((p) => p.san)),
        studyId: null,
        importOpen: false,
      });
      get().persistNow();
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Could not parse PGN";
    }
  },

  loadFen: (fen) => {
    try {
      const chess = new Chess(fen);
      set({
        startFen: chess.fen(),
        plies: [],
        cursor: 0,
        mode: "analyze",
        selected: null,
        dests: [],
        lastMove: null,
        opening: "Custom position",
        studyId: null,
        importOpen: false,
      });
      get().persistNow();
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : "Invalid FEN";
    }
  },

  loadStudy: (id) => {
    const study = STUDIES.find((s) => s.id === id);
    if (!study) return;
    const chess = new Chess(study.fen);
    set({
      startFen: chess.fen(),
      plies: [],
      cursor: 0,
      mode: "study",
      orientation: chess.turn(),
      playerColor: chess.turn(),
      selected: null,
      dests: [],
      lastMove: null,
      opening: study.title,
      studyId: id,
      studySolved: false,
      studyMiss: false,
      engineOn: true,
    });
  },

  selectSquare: (sq) => {
    const s = get();
    const chess = s.chess();
    const piece = chess.get(sq);
    if (s.pendingPromotion) return;
    if (s.selected && s.dests.includes(sq)) {
      get().tryMove(s.selected, sq);
      return;
    }
    if (piece && get().canMove(piece.color) && piece.color === chess.turn()) {
      set({ selected: sq, dests: destsFor(chess, sq) });
      return;
    }
    set({ selected: null, dests: [] });
  },

  tryMove: (from, to, promotion) => {
    const s = get();
    const chess = s.chess();
    const piece = chess.get(from);
    if (!piece) return false;
    if (chess.isGameOver()) return false;
    if (chess.turn() !== piece.color) return false;
    const legal = chess.moves({ square: from, verbose: true }).find((m) => m.to === to);
    if (!legal) {
      set({ selected: null, dests: [] });
      return false;
    }
    if (legal.promotion && !promotion) {
      set({ pendingPromotion: { from, to }, selected: from, dests: [to] });
      return true;
    }
    const beforeFen = chess.fen();
    let moved;
    try {
      moved = chess.move({ from, to, promotion });
    } catch {
      return false;
    }
    if (!moved) return false;

    const ply: Ply = {
      san: moved.san,
      from: moved.from,
      to: moved.to,
      promotion: moved.promotion,
      uci: toUci(moved.from, moved.to, moved.promotion),
      fenAfter: chess.fen(),
    };
    const sans = [...s.plies.slice(0, s.cursor).map((p) => p.san), ply.san];
    if (s.lines.length) {
      ply.classification = classifyFromLines(beforeFen, ply.uci, s.lines, isBookMove(sans));
    } else if (isBookMove(sans)) {
      ply.classification = "book";
    }

    let studySolved = s.studySolved;
    let studyMiss = s.studyMiss;
    if (s.mode === "study" && s.studyId && s.cursor === 0 && s.plies.length === 0) {
      const study = STUDIES.find((st) => st.id === s.studyId);
      if (study) {
        if (ply.uci === study.solution || ply.uci.startsWith(study.solution)) {
          studySolved = true;
          ply.classification = "brilliant";
        } else {
          studyMiss = true;
        }
      }
    }

    if (s.sound) {
      resumeAudio();
      const over = chess.isGameOver();
      const kind =
        ply.classification === "brilliant"
          ? "brilliant"
          : over
            ? "gameover"
            : chess.inCheck()
              ? "check"
              : moved.isCapture()
                ? "capture"
                : "move";
      playMoveSound(kind);
    }

    set({
      plies: [...s.plies.slice(0, s.cursor), ply],
      cursor: s.cursor + 1,
      selected: null,
      dests: [],
      pendingPromotion: null,
      lastMove: { from: moved.from, to: moved.to },
      opening: openingName(sans),
      studySolved,
      studyMiss,
      dragging: null,
      hoverDest: null,
    });
    get().persistNow();
    return true;
  },

  choosePromotion: (piece) => {
    const pending = get().pendingPromotion;
    if (!pending) return;
    get().tryMove(pending.from, pending.to, piece);
  },

  cancelPromotion: () => set({ pendingPromotion: null, selected: null, dests: [] }),

  goto: (cursor) => {
    const s = get();
    const next = Math.max(0, Math.min(cursor, s.plies.length));
    set({
      cursor: next,
      selected: null,
      dests: [],
      lastMove: lastFromPlies(s.plies, next),
      pendingPromotion: null,
    });
    get().persistNow();
  },

  flip: () => set({ orientation: get().orientation === "w" ? "b" : "w" }),

  takeback: () => {
    const s = get();
    const n = s.mode === "play" ? 2 : 1;
    get().goto(Math.max(0, s.cursor - n));
  },

  playHint: () => {
    const hint = get().brilliant;
    if (!hint) return;
    const { from, to, promotion } = uciParts(hint.uci);
    get().tryMove(from, to, promotion);
  },

  setMode: (mode) => set({ mode }),
  setEngineOn: (engineOn) => set({ engineOn }),
  setMovetime: (movetime) => set({ movetime }),
  setSound: (sound) => set({ sound }),
  setShowCoords: (showCoords) => set({ showCoords }),
  setEngineReady: (engineReady) => set({ engineReady }),
  setThinking: (thinking) => set({ thinking }),
  setImportOpen: (importOpen) => set({ importOpen }),
  setHoverDest: (hoverDest) => set({ hoverDest }),
  setDragging: (dragging) => set({ dragging }),

  applyAnalysis: (result, fen) => {
    if (get().fen() !== fen) return;
    const chess = get().chess();
    const turn = chess.turn();
    const lines = result.lines;
    const best = lines[0];
    const evalScore = best ? (turn === "w" ? best.score : { type: best.score.type, value: -best.score.value }) : null;
    const brilliant = pickBrilliant(fen, lines);
    const plies = get().plies.slice();
    const idx = get().cursor - 1;
    if (idx >= 0 && plies[idx]) {
      plies[idx] = { ...plies[idx], evalAfter: evalScore ?? undefined };
    }
    set({ lines, evalScore, brilliant, thinking: false, plies });
  },
}));

export function usePosition(): Chess {
  const startFen = useGame((s) => s.startFen);
  const cursor = useGame((s) => s.cursor);
  const key = useGame((s) => s.plies.map((p) => p.uci).join(" "));
  return useMemo(() => chessAt(startFen, useGame.getState().plies, cursor), [startFen, cursor, key]);
}

export function currentKingInCheck(): Square | null {
  const chess = useGame.getState().chess();
  if (!chess.inCheck()) return null;
  return kingSquare(chess, chess.turn());
}

export function gameStatus(): string | null {
  return statusText(useGame.getState().chess());
}
