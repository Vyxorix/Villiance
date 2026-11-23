import assert from "node:assert/strict";
import { Chess } from "chess.js";
import { createServer } from "vite";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

const { skillForStrength, formatClock, outcomeFromChess } = await server.ssrLoadModule("/src/lib/chess/play.ts");

try {
  assert.equal(skillForStrength(0), 20);
  assert.equal(skillForStrength(1200), 0);
  assert.equal(skillForStrength(1500), 4);
  assert.equal(formatClock(65_000), "1:05");
  assert.equal(formatClock(0), "0:00");

  const mate = new Chess("7k/6Q1/6K1/8/8/8/8/8 b - - 0 1");
  assert.equal(mate.isCheckmate(), true);
  const over = outcomeFromChess(mate, "w");
  assert.equal(over?.winner, "w");
  assert.match(over?.reason ?? "", /checkmate/);

  const start = new Chess();
  assert.equal(outcomeFromChess(start, "w"), null);

  console.log("play tests passed");
} finally {
  await server.close();
}
