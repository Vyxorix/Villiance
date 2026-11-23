import type { Chess } from "chess.js";
import type { Color, PieceSymbol, Square } from "./types";

export type Placed = { id: string; sq: Square; color: Color; type: PieceSymbol };

const FILES = "abcdefgh";

let serial = 1;
function freshId() {
  serial += 1;
  return `p${serial}`;
}

function castleRook(last: { from: Square; to: Square }): { from: Square; to: Square } | null {
  if (last.from[0] !== "e" || last.from[1] !== last.to[1]) return null;
  const delta = last.to.charCodeAt(0) - last.from.charCodeAt(0);
  const rank = last.from[1];
  if (delta === 2) return { from: `h${rank}` as Square, to: `f${rank}` as Square };
  if (delta === -2) return { from: `a${rank}` as Square, to: `d${rank}` as Square };
  return null;
}

/** Keep piece identity across a position so a move can slide instead of popping. */
export function placePieces(
  prev: Placed[],
  chess: Chess,
  lastMove: { from: Square; to: Square } | null,
): Placed[] {
  const onBoard: { sq: Square; color: Color; type: PieceSymbol }[] = [];
  for (const file of FILES) {
    for (let rank = 1; rank <= 8; rank++) {
      const sq = `${file}${rank}` as Square;
      const piece = chess.get(sq);
      if (piece) onBoard.push({ sq, color: piece.color, type: piece.type });
    }
  }

  const used = new Set<string>();
  const takenSq = new Set<Square>();
  const out: Placed[] = [];
  const claim = (id: string, sq: Square, color: Color, type: PieceSymbol) => {
    if (used.has(id) || takenSq.has(sq)) return;
    used.add(id);
    takenSq.add(sq);
    out.push({ id, sq, color, type });
  };

  if (lastMove) {
    const mover = chess.get(lastMove.to);
    const from = prev.find((piece) => piece.sq === lastMove.from);
    if (mover && from && from.color === mover.color) claim(from.id, lastMove.to, mover.color, mover.type);
    const rook = castleRook(lastMove);
    if (rook) {
      const rookPrev = prev.find((piece) => piece.sq === rook.from);
      const rookNow = chess.get(rook.to);
      if (rookPrev && rookNow && rookPrev.color === rookNow.color) {
        claim(rookPrev.id, rook.to, rookNow.color, rookNow.type);
      }
    }
  }

  for (const piece of onBoard) {
    if (takenSq.has(piece.sq)) continue;
    const stay = prev.find((item) => item.sq === piece.sq && item.color === piece.color && item.type === piece.type);
    if (stay) claim(stay.id, piece.sq, piece.color, piece.type);
  }
  for (const piece of onBoard) {
    if (takenSq.has(piece.sq)) continue;
    claim(freshId(), piece.sq, piece.color, piece.type);
  }
  return out;
}

export function squarePercent(sq: Square, orientation: Color) {
  const file = sq.charCodeAt(0) - 97;
  const rank = Number(sq[1]) - 1;
  const x = orientation === "w" ? file : 7 - file;
  const y = orientation === "w" ? 7 - rank : rank;
  return { left: `${x * 12.5}%`, top: `${y * 12.5}%` };
}
