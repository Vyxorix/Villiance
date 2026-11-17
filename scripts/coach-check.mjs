import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

const {
  coachFromLines,
  coachSentence,
  nullMoveFen,
  planClipboard,
  refineCoach,
  threatMatters,
} = await server.ssrLoadModule("/src/lib/chess/coach.ts");

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const CHECK = "rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3";

function line(multipv, score, uci, san) {
  return { multipv, depth: 12, score, pv: [uci], san: [san] };
}

function cp(value) {
  return { type: "cp", value };
}

const empty = { fen: START, startFen: START, plies: [], cursor: 0 };

try {
  const best = coachFromLines("e4", "e2e4", [line(1, cp(30), "e2e4", "e4")], false);
  assert.equal(best.judgement, "best");
  assert.equal(coachSentence(best), "You played e4. That's the move.");

  const book = coachFromLines("e4", "e2e4", [line(1, cp(30), "e2e4", "e4")], true);
  assert.equal(coachSentence(book), "You played e4. Book, and the move.");

  const blunder = coachFromLines(
    "Qh4",
    "d8h4",
    [line(1, cp(40), "g8f6", "Nf6"), line(2, cp(-400), "d8h4", "Qh4")],
    false,
  );
  assert.equal(blunder.judgement, "blunder");
  assert.match(coachSentence(blunder), /Engine wanted Nf6/);
  assert.match(coachSentence(blunder), /Blunder/);

  const missed = coachFromLines("a3", "a2a3", [line(1, cp(30), "e2e4", "e4")], false);
  assert.equal(missed.judgement, "miss");
  assert.equal(coachSentence(missed), "You played a3. Engine wanted e4.");

  const refined = refineCoach(
    { ...missed, judgement: "miss" },
    cp(20),
    cp(-30),
    "w",
  );
  assert.equal(refined.lossCp, 50);

  assert.equal(nullMoveFen(CHECK), null);
  const passed = nullMoveFen(START);
  assert.ok(passed);
  assert.match(passed, / b /);

  assert.equal(threatMatters({ capture: true, check: false, lossForPasserCp: 0 }), true);
  assert.equal(threatMatters({ capture: false, check: false, lossForPasserCp: 40 }), false);
  assert.equal(threatMatters({ capture: false, check: false, lossForPasserCp: 120 }), true);

  const one = planClipboard("e4", empty, false);
  assert.equal(one.type, "moves");
  assert.equal(one.moves[0].san, "e4");

  const glued = planClipboard("1.e4 e5 2.Nf3", empty, false);
  assert.equal(glued.type, "moves");
  assert.equal(glued.moves.map((m) => m.san).join(" "), "e4 e5 Nf3");

  const mid = {
    fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    startFen: START,
    plies: [{ san: "e4", uci: "e2e4" }],
    cursor: 1,
  };
  const extend = planClipboard("1. e4 e5 2. Nf3", mid, false);
  assert.equal(extend.type, "moves");
  assert.deepEqual(extend.moves.map((m) => m.san), ["e5", "Nf3"]);

  const stray = planClipboard("d4", mid, false);
  assert.equal(stray.type, "ignore");

  const same = planClipboard("1. e4", mid, false);
  assert.equal(same.type, "already");

  const fen = planClipboard("rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2", mid, false);
  assert.equal(fen.type, "fen");

  const noise = planClipboard("see you at 5", mid, false);
  assert.equal(noise.type, "ignore");

  console.log("coach tests passed");
} finally {
  await server.close();
}
