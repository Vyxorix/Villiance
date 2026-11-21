import type { Color, PieceSymbol, Square } from "chess.js";
import { Chess } from "chess.js";
import { pieceSrc } from "./helpers";

const FILES = "abcdefgh";

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function squareFill(light: boolean, lightColor: string, darkColor: string): string {
  return light ? lightColor : darkColor;
}

export async function sharePositionCard(opts: {
  fen: string;
  orientation: Color;
  title: string;
  caption: string;
}): Promise<void> {
  const root = document.querySelector("[data-board]");
  const style = root ? getComputedStyle(root) : getComputedStyle(document.documentElement);
  const light = style.getPropertyValue("--color-board-light").trim() || "#e6e1cc";
  const dark = style.getPropertyValue("--color-board-dark").trim() || "#5e7a63";
  const bg = style.getPropertyValue("--color-bg").trim() || "#0c0d0b";
  const fg = style.getPropertyValue("--color-fg").trim() || "#eceae4";

  const chess = new Chess(opts.fen);
  const size = 640;
  const board = 520;
  const origin = (size - board) / 2;
  const sq = board / 8;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size + 120;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not draw the card");

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = fg;
  ctx.font = "500 28px Georgia, serif";
  ctx.fillText("Villiance", 28, 42);

  const ranks = opts.orientation === "w" ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7];
  const files = opts.orientation === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const pieces: { img: Promise<HTMLImageElement | null>; x: number; y: number }[] = [];

  ranks.forEach((rank, row) => {
    files.forEach((file, col) => {
      const x = origin + col * sq;
      const y = 64 + row * sq;
      const lightSq = (file + rank) % 2 === 1;
      ctx.fillStyle = squareFill(lightSq, light, dark);
      ctx.fillRect(x, y, sq, sq);
      const name = `${FILES[file]}${rank + 1}` as Square;
      const piece = chess.get(name);
      if (piece) {
        pieces.push({
          img: loadImage(pieceSrc(piece.color, piece.type as PieceSymbol)),
          x,
          y,
        });
      }
    });
  });

  const loaded = await Promise.all(pieces.map((p) => p.img));
  loaded.forEach((img, i) => {
    const spot = pieces[i];
    if (!img || !spot) return;
    const pad = sq * 0.08;
    ctx.drawImage(img, spot.x + pad, spot.y + pad, sq - pad * 2, sq - pad * 2);
  });

  ctx.fillStyle = fg;
  ctx.font = "500 22px Georgia, serif";
  ctx.fillText(opts.title.slice(0, 42), 28, 64 + board + 36);
  ctx.font = "16px sans-serif";
  ctx.globalAlpha = 0.75;
  ctx.fillText(opts.caption.slice(0, 72), 28, 64 + board + 64);
  ctx.globalAlpha = 1;

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not export the card");
  const file = new File([blob], "villiance.png", { type: "image/png" });
  const shareData = { files: [file], title: "Villiance", text: opts.caption };
  if (typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(shareData))) {
    await navigator.share(shareData);
    return;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "villiance.png";
  a.click();
  URL.revokeObjectURL(url);
}
