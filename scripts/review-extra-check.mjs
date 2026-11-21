import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

const { openingReport, pickBookReply } = await server.ssrLoadModule("/src/lib/chess/openings.ts");
const { annotatedPgn } = await server.ssrLoadModule("/src/lib/chess/annotated.ts");

try {
  const ruy = openingReport(["e4", "e5", "Nf3", "Nc6", "Bb5"]);
  assert.equal(ruy.leftSan, null);
  assert.match(ruy.name ?? "", /Ruy Lopez/);

  const left = openingReport(["e4", "e5", "Qh4"]);
  assert.equal(left.leftSan, "Qh4");
  assert.ok(left.wanted.includes("Nf3"), left.wanted.join(","));

  const book = pickBookReply([], null);
  assert.equal(book, "e4");
  assert.equal(pickBookReply(["e4", "e5", "h4"], "Nc3"), null);

  const pgn = annotatedPgn("", [
    {
      san: "e4",
      from: "e2",
      to: "e4",
      uci: "e2e4",
      fenAfter: "",
      classification: "book",
    },
    {
      san: "Qh4",
      from: "d8",
      to: "h4",
      uci: "d8h4",
      fenAfter: "",
      classification: "blunder",
      better: { uci: "g8f6", san: "Nf6", pvSan: ["Nf6", "Nc3"] },
    },
  ]);
  assert.match(pgn, /1\. e4 \{Book\} Qh4\?\? \{Blunder\. Engine wanted Nf6/);

  console.log("review extra tests passed");
} finally {
  await server.close();
}
