import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

const { moveAccuracy, summarizeReview } = await server.ssrLoadModule("/src/lib/chess/review.ts");

try {
  const even = moveAccuracy({ type: "cp", value: 30 }, { type: "cp", value: 30 }, "w");
  assert.ok(even > 99.5 && even <= 100, `equal eval should be ~100, got ${even}`);

  const held = moveAccuracy({ type: "cp", value: 80 }, { type: "cp", value: -80 }, "b");
  assert.ok(held > 99, "black keeping a small edge is accurate");

  const blunder = moveAccuracy({ type: "cp", value: 40 }, { type: "cp", value: -400 }, "w");
  assert.ok(blunder < 40, `a collapsed eval should hurt accuracy, got ${blunder}`);

  const review = summarizeReview(
    [
      { san: "e4", from: "e2", to: "e4", uci: "e2e4", fenAfter: "", classification: "book", evalAfter: { type: "cp", value: 20 } },
      { san: "e5", from: "e7", to: "e5", uci: "e7e5", fenAfter: "", classification: "blunder", evalAfter: { type: "cp", value: 380 } },
    ],
    { type: "cp", value: 20 },
  );
  assert.equal(review.w.counts.book, 1);
  assert.equal(review.b.counts.blunder, 1);
  assert.equal(review.w.counts.brilliant, 0);
  assert.ok(review.w.accuracy > 90);
  assert.ok(review.b.accuracy < 50);
  assert.equal(review.graph.length, 3);
  assert.equal(review.total, 2);
  console.log("review checks passed");
} finally {
  await server.close();
}
