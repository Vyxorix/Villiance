import { useCallback, useEffect, useRef, useState } from "react";
import type { PieceSymbol, Square } from "chess.js";
import { FILES, kingSquare, pieceSrc, uciParts } from "@/lib/chess/helpers";
import { cn } from "@/lib/utils";
import { useGame, usePosition } from "@/store/game";
import type { Color, PromotionPiece } from "@/lib/chess/types";

const PROMO: PromotionPiece[] = ["q", "n", "r", "b"];

function displayGrid(orientation: Color): Square[] {
  const squares: Square[] = [];
  const ranks = orientation === "w" ? [8, 7, 6, 5, 4, 3, 2, 1] : [1, 2, 3, 4, 5, 6, 7, 8];
  const files = orientation === "w" ? FILES : [...FILES].reverse().join("");
  for (const r of ranks) {
    for (const f of files) {
      squares.push(`${f}${r}` as Square);
    }
  }
  return squares;
}

function isLight(sq: Square) {
  const file = sq.charCodeAt(0) - 97;
  const rank = Number(sq[1]) - 1;
  return (file + rank) % 2 === 1;
}

function squareCenter(sq: Square, orientation: Color) {
  const file = sq.charCodeAt(0) - 97;
  const rank = Number(sq[1]) - 1;
  const x = orientation === "w" ? file : 7 - file;
  const y = orientation === "w" ? 7 - rank : rank;
  return { x: (x + 0.5) / 8, y: (y + 0.5) / 8 };
}

export function ChessBoard() {
  const orientation = useGame((s) => s.orientation);
  const selected = useGame((s) => s.selected);
  const dests = useGame((s) => s.dests);
  const lastMove = useGame((s) => s.lastMove);
  const brilliant = useGame((s) => s.brilliant);
  const lines = useGame((s) => s.lines);
  const showCoords = useGame((s) => s.showCoords);
  const pending = useGame((s) => s.pendingPromotion);
  const dragging = useGame((s) => s.dragging);
  const hoverDest = useGame((s) => s.hoverDest);
  const chess = usePosition();
  const boardRef = useRef<HTMLDivElement>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number; src: string } | null>(null);

  const inCheck = chess.inCheck();
  const checkSq = inCheck ? kingSquare(chess, chess.turn()) : null;
  const squares = displayGrid(orientation);
  const turn = chess.turn();

  const sqFromPoint = useCallback(
    (clientX: number, clientY: number): Square | null => {
      const el = boardRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      const px = (clientX - rect.left) / rect.width;
      const py = (clientY - rect.top) / rect.height;
      if (px < 0 || py < 0 || px >= 1 || py >= 1) return null;
      const col = Math.min(7, Math.floor(px * 8));
      const row = Math.min(7, Math.floor(py * 8));
      const file = orientation === "w" ? col : 7 - col;
      const rank = orientation === "w" ? 7 - row : row;
      return `${FILES[file]}${rank + 1}` as Square;
    },
    [orientation],
  );

  const onPointerDown = (e: React.PointerEvent, sq: Square) => {
    const piece = chess.get(sq);
    useGame.getState().selectSquare(sq);
    if (!piece) return;
    if (!useGame.getState().canMove(piece.color)) return;
    useGame.getState().setDragging(sq);
    setGhost({ x: e.clientX, y: e.clientY, src: pieceSrc(piece.color, piece.type) });
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      setGhost((g) => (g ? { ...g, x: e.clientX, y: e.clientY } : g));
      useGame.getState().setHoverDest(sqFromPoint(e.clientX, e.clientY));
    };
    const onUp = (e: PointerEvent) => {
      const dest = sqFromPoint(e.clientX, e.clientY);
      const from = useGame.getState().dragging;
      useGame.getState().setDragging(null);
      setGhost(null);
      useGame.getState().setHoverDest(null);
      if (from && dest && dest !== from) useGame.getState().tryMove(from, dest);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [dragging, sqFromPoint]);

  const arrowMoves: { from: Square; to: Square; kind: "best" | "brilliant" }[] = [];
  if (brilliant) {
    const p = uciParts(brilliant.uci);
    arrowMoves.push({
      from: p.from,
      to: p.to,
      kind: brilliant.sacrifice || brilliant.mate ? "brilliant" : "best",
    });
  } else if (lines[0]?.pv[0]) {
    const p = uciParts(lines[0].pv[0]);
    arrowMoves.push({ from: p.from, to: p.to, kind: "best" });
  }

  const promoColor: Color = pending ? (chess.get(pending.from)?.color ?? turn) : turn;

  return (
    <div className="relative w-full">
      <div
        ref={boardRef}
        role="grid"
        aria-label="Chessboard"
        onPointerCancel={() => {
          useGame.getState().setDragging(null);
          setGhost(null);
        }}
        className="relative aspect-square w-full overflow-hidden rounded-[var(--radius-lg)] shadow-[0_0_0_1px_rgba(236,234,228,0.08)] select-none touch-none"
      >
        <div className="grid h-full w-full grid-cols-8 grid-rows-8">
          {squares.map((sq) => {
            const piece = chess.get(sq);
            const light = isLight(sq);
            const isLast = lastMove && (lastMove.from === sq || lastMove.to === sq);
            const isSel = selected === sq;
            const isDest = dests.includes(sq);
            const isHover = hoverDest === sq && dragging;
            const file = sq[0];
            const rank = sq[1];
            const showFile =
              showCoords && (orientation === "w" ? rank === "1" : rank === "8");
            const showRank =
              showCoords && (orientation === "w" ? file === "a" : file === "h");
            return (
              <button
                key={sq}
                type="button"
                role="gridcell"
                aria-label={sq}
                onPointerDown={(e) => onPointerDown(e, sq)}
                className={cn(
                  "relative flex items-center justify-center",
                  light ? "bg-board-light" : "bg-board-dark",
                  isLast && "after:absolute after:inset-0 after:bg-board-last/45 after:content-['']",
                  isSel && "after:absolute after:inset-0 after:bg-board-select/55 after:content-['']",
                  isHover && "ring-inset ring-2 ring-brilliant",
                  checkSq === sq && "after:absolute after:inset-0 after:bg-check/40 after:content-['']",
                )}
              >
                {showFile && (
                  <span
                    className={cn(
                      "absolute right-1 bottom-0.5 text-[10px] font-medium",
                      light ? "text-board-dark/70" : "text-board-light/80",
                    )}
                  >
                    {file}
                  </span>
                )}
                {showRank && (
                  <span
                    className={cn(
                      "absolute top-0.5 left-1 text-[10px] font-medium",
                      light ? "text-board-dark/70" : "text-board-light/80",
                    )}
                  >
                    {rank}
                  </span>
                )}
                {isDest && !piece && (
                  <span className="relative z-10 size-[22%] rounded-full bg-accent-fg/25" />
                )}
                {isDest && piece && (
                  <span className="absolute inset-[6%] z-10 rounded-full border-[3px] border-accent-fg/35" />
                )}
                {piece && dragging !== sq && (
                  <img
                    src={pieceSrc(piece.color, piece.type)}
                    alt=""
                    draggable={false}
                    className="relative z-10 h-[86%] w-[86%] object-contain"
                  />
                )}
              </button>
            );
          })}
        </div>

        <svg className="pointer-events-none absolute inset-0 z-20 h-full w-full" viewBox="0 0 1 1">
          <defs>
            <marker id="arrow-best" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <polygon points="0 0, 7 3.5, 0 7" className="fill-great" />
            </marker>
            <marker id="arrow-brilliant" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto">
              <polygon points="0 0, 7 3.5, 0 7" className="fill-brilliant" />
            </marker>
          </defs>
          {arrowMoves.map((a) => {
            const s = squareCenter(a.from, orientation);
            const t = squareCenter(a.to, orientation);
            const dx = t.x - s.x;
            const dy = t.y - s.y;
            const len = Math.hypot(dx, dy) || 1;
            const shrink = 0.07;
            const x2 = t.x - (dx / len) * shrink;
            const y2 = t.y - (dy / len) * shrink;
            return (
              <line
                key={`${a.from}${a.to}${a.kind}`}
                x1={s.x}
                y1={s.y}
                x2={x2}
                y2={y2}
                strokeWidth={0.028}
                strokeLinecap="round"
                className={a.kind === "brilliant" ? "stroke-brilliant/85" : "stroke-great/70"}
                markerEnd={a.kind === "brilliant" ? "url(#arrow-brilliant)" : "url(#arrow-best)"}
              />
            );
          })}
        </svg>

        {pending && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg/45">
            <div className="flex gap-1 rounded-[var(--radius-md)] bg-surface p-1.5 shadow-lg">
              {PROMO.map((p) => (
                <button
                  key={p}
                  type="button"
                  className="size-14 rounded-[var(--radius-sm)] bg-surface-2 hover:bg-board-select/40"
                  onClick={() => useGame.getState().choosePromotion(p)}
                  aria-label={`Promote to ${p}`}
                >
                  <img src={pieceSrc(promoColor, p as PieceSymbol)} alt="" className="h-full w-full p-1" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {ghost && (
        <img
          src={ghost.src}
          alt=""
          className="pointer-events-none fixed z-50 size-16 -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-lg"
          style={{ left: ghost.x, top: ghost.y }}
        />
      )}
    </div>
  );
}
