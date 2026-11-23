import assert from "node:assert/strict";
import { Chess } from "chess.js";
import lines from "../src/lib/chess/lines.json" with { type: "json" };

const alien = lines.find((line) => line.name === "Caro-Kann Defense: Alien Gambit");
assert.ok(alien);
assert.deepEqual(alien.sans.slice(0, 5), ["e4", "c6", "d4", "d5", "Nc3"]);

const italian = lines.find((line) => line.name === "Italian Game");
assert.deepEqual(italian.sans, ["e4", "e5", "Nf3", "Nc6", "Bc4"]);

const chess = new Chess();
for (const san of italian.sans) chess.move(san);
assert.equal(chess.isGameOver(), false);

const names = new Set(lines.map((line) => line.name));
assert.ok(names.size > 3000);
assert.ok(lines.length > 3000);

console.log("studies tests passed", lines.length);
