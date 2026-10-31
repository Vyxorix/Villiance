import { Chess } from "chess.js";
import { assessBrilliant, labelFromEvals } from "@/lib/chess/classify";
import { getEngine } from "@/lib/chess/engine";
import { evalToWhitePct, whiteScore } from "@/lib/chess/helpers";
import { isBookMove } from "@/lib/chess/openings";
import type { EngineLine, Ply, Score } from "@/lib/chess/types";
import { useGame } from "@/store/game";

function fenAt(startFen: string, plies: Ply[], cursor: number): string {
  const chess = new Chess();
  if (startFen) chess.load(startFen);
  for (let i = 0; i < cursor; i++) {
    const ply = plies[i];
    if (!ply) break;
    chess.move({ from: ply.from, to: ply.to, promotion: ply.promotion });
  }
  return chess.fen();
}

/** Walk every position once and fill evals plus move labels. */
export async function runReview(force = false): Promise<void> {
  const engine = getEngine();
  const started = useGame.getState();
  if (started.plies.length === 0 || started.reviewing) return;
  const id = started.reviewId;
  useGame.setState({ reviewing: true, reviewProgress: 0 });
  engine.stop();

  const plies = started.plies.map((p) => ({ ...p }));
  const sig = plies.map((p) => p.uci).join(" ");
  let startEval: Score | null = started.startEval;
  const steps = plies.length + 1;
  let prev: { fen: string; lines: EngineLine[]; evalWhite: Score; bestUci: string } | null = null;

  const current = () => {
    const s = useGame.getState();
    return s.reviewId === id && s.plies.map((p) => p.uci).join(" ") === sig;
  };

  const labelPlayed = (index: number, after: Score) => {
    const ply = plies[index];
    if (!ply || !prev) return;
    const sans = plies.slice(0, index + 1).map((p) => p.san);
    const book = isBookMove(sans);
    const best = prev.lines[0];
    const second = prev.lines[1];
    const verdict = prev.lines.length
      ? assessBrilliant(prev.fen, ply.uci, prev.lines, { book: false })
      : null;
    const gap = best && second ? evalToWhitePct(best.score) - evalToWhitePct(second.score) : 0;
    const great = Boolean(
      best &&
        ply.uci === best.pv[0] &&
        second &&
        gap >= 0.1 &&
        evalToWhitePct(second.score) < 0.97,
    );
    plies[index] = {
      ...ply,
      evalAfter: after,
      classification: labelFromEvals({
        book,
        before: prev.evalWhite,
        after,
        mover: index % 2 === 0 ? "w" : "b",
        playedUci: ply.uci,
        bestUci: prev.bestUci,
        brilliant: Boolean(verdict?.brilliant) || ply.classification === "brilliant",
        great: great || ply.classification === "great",
      }),
    };
  };

  try {
    await engine.start();
    for (let i = 0; i < steps; i++) {
      if (!current()) break;
      const fen = fenAt(started.startFen, plies, i);
      const haveEval = i === 0 ? startEval : plies[i - 1]?.evalAfter;
      const needClass = i < plies.length && (force || !plies[i]?.classification);
      let evalScore: Score | null = haveEval ?? null;
      let lines: EngineLine[] = [];
      if (force || !haveEval || needClass) {
        const movetime = Math.min(320, Math.max(160, useGame.getState().movetime));
        const result = await engine.analyze(fen, { movetime, multipv: 2 });
        if (!current()) break;
        const best = result.lines[0];
        const turn = new Chess(fen).turn();
        evalScore = best ? whiteScore(best.score, turn) : null;
        lines = result.lines;
      }
      if (i === 0) startEval = evalScore;
      else if (evalScore) labelPlayed(i - 1, evalScore);
      if (evalScore) {
        prev = { fen, lines, evalWhite: evalScore, bestUci: lines[0]?.pv[0] ?? "" };
      }
      useGame.setState({
        plies: plies.map((p) => ({ ...p })),
        startEval,
        reviewProgress: i + 1,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message !== "Stopped" && message !== "Superseded") console.error(err);
  } finally {
    if (useGame.getState().reviewId === id) useGame.setState({ reviewing: false });
  }
}
