import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { placePieces } from "../src/lib/chess/motion.ts";

const start = new Chess();
const placed = placePieces([], start, null);
assert.equal(placed.length, 32);
const pawn = placed.find((piece) => piece.sq === "e2");
assert.ok(pawn);

start.move("e4");
const after = placePieces(placed, start, { from: "e2", to: "e4" });
assert.equal(after.find((piece) => piece.id === pawn.id)?.sq, "e4");
assert.equal(after.length, 32);

const castle = new Chess("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
const before = placePieces([], castle, null);
const king = before.find((piece) => piece.sq === "e1");
const rook = before.find((piece) => piece.sq === "h1");
castle.move("O-O");
const castled = placePieces(before, castle, { from: "e1", to: "g1" });
assert.equal(castled.find((piece) => piece.id === king.id)?.sq, "g1");
assert.equal(castled.find((piece) => piece.id === rook.id)?.sq, "f1");

console.log("motion tests passed");
