import { Chess } from "chess.js";
import { classifyFromLines } from "@/lib/chess/classify";
import { getEngine } from "@/lib/chess/engine";
import { whiteScore } from "@/lib/chess/helpers";
import { isBookMove } from "@/lib/chess/openings";
import type { Ply, Score } from "@/lib/chess/types";
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

  const current = () => {
    const s = useGame.getState();
    return s.reviewId === id && s.plies.map((p) => p.uci).join(" ") === sig;
  };

  try {
    await engine.start();
    for (let i = 0; i < steps; i++) {
      if (!current()) break;
      const haveEval = i === 0 ? startEval : plies[i - 1]?.evalAfter;
      const needClass = i < plies.length && !plies[i]?.classification;
      if (!force && haveEval && !needClass) {
        useGame.setState({ reviewProgress: i + 1 });
        continue;
      }
      const fen = fenAt(started.startFen, plies, i);
      const movetime = Math.min(220, Math.max(120, useGame.getState().movetime));
      const result = await engine.analyze(fen, { movetime, multipv: 3 });
      if (!current()) break;
      const best = result.lines[0];
      const turn = new Chess(fen).turn();
      const evalScore = best ? whiteScore(best.score, turn) : null;
      if (i === 0) startEval = evalScore;
      else if (plies[i - 1] && evalScore) plies[i - 1] = { ...plies[i - 1], evalAfter: evalScore };
      if (i < plies.length && plies[i]) {
        const sans = plies.slice(0, i + 1).map((p) => p.san);
        plies[i] = {
          ...plies[i],
          classification: classifyFromLines(fen, plies[i].uci, result.lines, isBookMove(sans)),
        };
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
