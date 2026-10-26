import assert from "node:assert/strict";
import { createServer } from "vite";
import { Chess } from "chess.js";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

const {
  sacrificeCentipawns,
  immediateGain,
  assessBrilliant,
  classifyFromLines,
  needsDeeperCheck,
  pickBrilliant,
} = await server.ssrLoadModule("/src/lib/chess/classify.ts");

const LEGAL = "r2qkbnr/ppp2ppp/2np4/4p3/2B1P1b1/2N2N2/PPPP1PPP/R1BQK2R w KQkq - 4 5";
const GREEK = "rnbq1rk1/pppn1ppp/4p3/3pP3/1b1P4/2NB1N2/PPP2PPP/R1BQK2R w KQ - 5 7";
const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const ONLY = "R7/8/8/8/8/1K6/8/k7 b - - 0 1";

function line(multipv, depth, score, uci, san) {
  return { multipv, depth, score, pv: [uci], san: [san] };
}

function cp(value) {
  return { type: "cp", value };
}

function mate(value) {
  return { type: "mate", value };
}

try {
  assert.ok(new Chess(ONLY).moves().length === 1, "fixture must have one legal move");

  assert.equal(sacrificeCentipawns(START, "g1f3"), 0);
  assert.equal(sacrificeCentipawns(START, "e2e4"), 0);
  assert.ok(sacrificeCentipawns(LEGAL, "f3e5") >= 200, "Legal's knight leaves the queen hanging");
  assert.ok(sacrificeCentipawns(GREEK, "d3h7") >= 200, "Greek gift gives up the bishop");
  assert.ok(immediateGain(START, "g1f3") < 180);

  const soundLines = [
    line(1, 12, mate(2), "f3e5", "Nxe5"),
    line(2, 12, cp(40), "d2d3", "d3"),
  ];
  assert.equal(classifyFromLines(LEGAL, "f3e5", soundLines, false), "brilliant");
  assert.equal(pickBrilliant(LEGAL, soundLines).brilliant, true);
  assert.equal(pickBrilliant(LEGAL, soundLines).sacrifice, true);
  assert.match(pickBrilliant(LEGAL, soundLines).reason, /mate/i);

  const shallow = [
    line(1, 5, mate(2), "f3e5", "Nxe5"),
    line(2, 5, cp(40), "d2d3", "d3"),
  ];
  assert.equal(classifyFromLines(LEGAL, "f3e5", shallow, false), "great");
  assert.equal(assessBrilliant(LEGAL, "f3e5", shallow, { book: false }).rejected, "shallow");
  assert.equal(needsDeeperCheck(LEGAL, shallow), true);
  assert.equal(needsDeeperCheck(LEGAL, soundLines), false);

  const unsound = [
    line(1, 12, cp(80), "d2d3", "d3"),
    line(2, 12, cp(-450), "f3e5", "Nxe5"),
  ];
  const unsoundLabel = classifyFromLines(LEGAL, "f3e5", unsound, false);
  assert.notEqual(unsoundLabel, "brilliant");
  assert.ok(unsoundLabel === "blunder" || unsoundLabel === "mistake");

  const compensated = [
    line(1, 14, cp(180), "d3h7", "Bxh7+"),
    line(2, 14, cp(20), "c2c3", "c3"),
  ];
  assert.equal(classifyFromLines(GREEK, "d3h7", compensated, false), "brilliant");

  const closeSac = [
    line(1, 14, cp(180), "d3h7", "Bxh7+"),
    line(2, 14, cp(150), "c2c3", "c3"),
  ];
  assert.notEqual(classifyFromLines(GREEK, "d3h7", closeSac, false), "brilliant");
  assert.equal(assessBrilliant(GREEK, "d3h7", closeSac, { book: false }).rejected, "close-alternative");

  const quietFen = GREEK;
  const quietLines = [
    line(1, 14, cp(160), "a2a3", "a3"),
    line(2, 14, cp(-30), "h2h3", "h3"),
  ];
  assert.equal(sacrificeCentipawns(quietFen, "a2a3"), 0);
  assert.equal(classifyFromLines(quietFen, "a2a3", quietLines, false), "brilliant");
  assert.equal(assessBrilliant(quietFen, "a2a3", quietLines, { book: false }).kind, "quiet");

  const ordinaryBest = [
    line(1, 14, cp(30), "e2e4", "e4"),
    line(2, 14, cp(22), "g1f3", "Nf3"),
  ];
  assert.equal(classifyFromLines(START, "e2e4", ordinaryBest, false), "best");
  assert.equal(pickBrilliant(START, ordinaryBest).brilliant, false);

  assert.equal(classifyFromLines(START, "e2e4", ordinaryBest, true), "book");

  const defenseFen = GREEK;
  const defenseLines = [
    line(1, 13, cp(10), "a2a3", "a3"),
    line(2, 13, cp(-420), "h2h3", "h3"),
  ];
  assert.equal(classifyFromLines(defenseFen, "a2a3", defenseLines, false), "brilliant");
  assert.equal(assessBrilliant(defenseFen, "a2a3", defenseLines, { book: false }).kind, "defense");

  const onlyLines = [
    line(1, 13, cp(0), "a1b1", "Kb1"),
    line(2, 13, cp(-500), "a1a2", "Ka2"),
  ];
  assert.notEqual(classifyFromLines(ONLY, "a1b1", onlyLines, false), "brilliant");
  assert.equal(assessBrilliant(ONLY, "a1b1", onlyLines, { book: false }).rejected, "only-legal");

  const grabFen = "4k3/8/8/8/4q3/8/8/4QK2 w - - 0 1";
  const grabUci = "e1e4";
  assert.ok(immediateGain(grabFen, grabUci) >= 180);
  const grabLines = [
    line(1, 12, cp(800), grabUci, "Qxe4"),
    line(2, 12, cp(0), "e1e2", "Qe2"),
  ];
  assert.notEqual(classifyFromLines(grabFen, grabUci, grabLines, false), "brilliant");
  assert.equal(assessBrilliant(grabFen, grabUci, grabLines, { book: false }).rejected, "obvious-capture");

  const similar = [
    line(1, 14, cp(40), "a2a3", "a3"),
    line(2, 14, cp(35), "h2h3", "h3"),
    line(3, 14, cp(28), "a2a4", "a4"),
  ];
  assert.equal(classifyFromLines(GREEK, "a2a3", similar, false), "best");
  assert.equal(assessBrilliant(GREEK, "a2a3", similar, { book: false }).brilliant, false);

  console.log("chess classify tests passed");
} finally {
  await server.close();
}
