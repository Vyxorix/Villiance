import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

const { openingName, isBookMove } = await server.ssrLoadModule("/src/lib/chess/openings.ts");

try {
  assert.equal(openingName([]), "Starting position");
  assert.equal(isBookMove([]), false);

  assert.equal(openingName(["e4"]), "King's Pawn Game");
  assert.equal(isBookMove(["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"]), true);
  assert.equal(openingName(["e4", "e5", "Nf3", "Nc6", "Bb5", "a6"]), "Ruy Lopez: Morphy Defense");

  const najdorf = ["e4", "c5", "Nf3", "d6", "d4", "cxd4", "Nxd4", "Nf6", "Nc3", "a6"];
  assert.equal(openingName(najdorf), "Sicilian Defense: Najdorf Variation");
  assert.equal(isBookMove(najdorf), true);

  assert.equal(openingName(["e4", "e6", "d4", "d5", "e5"]), "French Defense: Advance Variation");
  assert.equal(openingName(["d4", "Nf6", "c4", "g6", "Nc3", "Bg7"]), "King's Indian Defense: Normal Variation");
  assert.equal(openingName(["d4", "d5", "c4", "e6", "Nc3", "Nf6"]), "Queen's Gambit Declined: Normal Defense");

  // Left theory. Ke2 is a named joke line, so use a move that is not in the book.
  // The name stays with the last book position.
  const side = ["e4", "e5", "a4"];
  assert.equal(openingName(side), "King's Pawn Game");
  assert.equal(isBookMove(side), false);

  assert.equal(openingName(["e4", "c6", "d4", "d5", "exd5", "cxd5"]), "Caro-Kann Defense: Exchange Variation");
  assert.equal(openingName(["e4", "d5", "exd5", "Qxd5", "Nc3"]), "Scandinavian Defense: Gubinsky-Melts Defense");
  assert.equal(openingName(["c4", "e5", "Nc3", "Nf6", "g3"]), "English Opening: Carls-Bremen System");
  assert.equal(isBookMove(["d4", "d5", "c4", "c6", "Nf3", "Nf6", "Nc3", "dxc4"]), true);

  // Check and castling marks from chess.js history still match.
  const closed = ["e4", "e5", "Nf3", "Nc6", "Bb5", "a6", "Ba4", "Nf6", "O-O", "Be7"];
  assert.equal(openingName(closed), "Ruy Lopez: Closed");
  assert.equal(isBookMove(closed), true);

  // Starting with a book move does not make the rest of the game book.
  assert.equal(isBookMove(["e4", "e5", "Qh5", "Nc6", "Qxf7+"]), false);

  console.log("opening book checks passed");
} finally {
  await server.close();
}
