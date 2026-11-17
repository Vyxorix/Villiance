import { useEffect, useRef } from "react";
import { nullMoveFen, passerLossCp, threatMatters, threatMoveInfo } from "@/lib/chess/coach";
import { needsDeeperCheck } from "@/lib/chess/classify";
import { getEngine } from "@/lib/chess/engine";
import { useGame } from "@/store/game";

export function useEngineBridge() {
  const startFen = useGame((s) => s.startFen);
  const cursor = useGame((s) => s.cursor);
  const plyFen = useGame((s) => s.plies[s.cursor - 1]?.fenAfter);
  const engineOn = useGame((s) => s.engineOn);
  const movetime = useGame((s) => s.movetime);
  const mode = useGame((s) => s.mode);
  const screen = useGame((s) => s.screen);
  const reviewing = useGame((s) => s.reviewing);
  const playerColor = useGame((s) => s.playerColor);
  const plyCount = useGame((s) => s.plies.length);
  const fen = plyFen ?? startFen;
  const gen = useRef(0);

  useEffect(() => {
    const engine = getEngine();
    void engine
      .start()
      .then(() => useGame.getState().setEngineReady(true))
      .catch(() => useGame.getState().setEngineReady(false));
  }, []);

  useEffect(() => {
    if (!engineOn || screen !== "board") {
      useGame.setState({ thinking: false, lines: [], brilliant: null });
      return;
    }
    if (reviewing) return;
    const id = ++gen.current;
    const engine = getEngine();
    const stored = useGame.getState().cursor > 0
      ? (useGame.getState().plies[useGame.getState().cursor - 1]?.evalAfter ?? null)
      : null;
    useGame.setState({ thinking: true, lines: [], brilliant: null, threat: null, evalScore: stored });
    let playTimer: number | undefined;
    void (async () => {
      try {
        await engine.start();
        if (id !== gen.current) return;
        useGame.getState().setEngineReady(true);
        const result = await engine.analyze(fen, { movetime, multipv: 4 });
        if (id !== gen.current) return;
        useGame.getState().applyAnalysis(result, fen);
        const s = useGame.getState();
        const chess = s.chess();
        const shouldReply =
          s.mode === "play" &&
          s.cursor === s.plies.length &&
          !chess.isGameOver() &&
          chess.turn() !== s.playerColor &&
          Boolean(s.brilliant);
        if (shouldReply) {
          playTimer = window.setTimeout(() => {
            if (id !== gen.current) return;
            useGame.getState().playHint();
          }, 260);
          return;
        }
        if (s.mode !== "play" && needsDeeperCheck(fen, result.lines)) {
          useGame.setState({ thinking: true });
          const deeper = await engine.analyze(fen, {
            movetime: Math.min(1600, Math.max(movetime, 480) + 500),
            multipv: 4,
          });
          if (id !== gen.current) return;
          useGame.getState().applyAnalysis(deeper, fen);
        }
        if (useGame.getState().mode === "analyze" && !useGame.getState().chess().isGameOver()) {
          const passed = nullMoveFen(fen);
          if (passed && id === gen.current) {
            const threat = await engine.analyze(passed, {
              movetime: Math.min(280, Math.max(160, movetime)),
              multipv: 1,
            });
            if (id !== gen.current) return;
            const uci = threat.lines[0]?.pv[0];
            const info = uci ? threatMoveInfo(passed, uci) : null;
            const score = threat.lines[0]?.score;
            const loss = score ? passerLossCp(useGame.getState().evalScore, score, useGame.getState().turn()) : null;
            if (uci && info && score && threatMatters({ capture: info.capture, check: info.check, lossForPasserCp: loss })) {
              useGame.getState().setThreat(fen, { uci, san: info.san });
            } else {
              useGame.getState().setThreat(fen, null);
            }
          }
        }
      } catch (err) {
        if (id === gen.current) useGame.getState().setThinking(false);
        const message = err instanceof Error ? err.message : "";
        if (message === "Stopped" || message === "Superseded") return;
        console.error(err);
      }
    })();
    return () => {
      if (playTimer) window.clearTimeout(playTimer);
      if (useGame.getState().reviewing) return;
      engine.stop();
    };
  }, [fen, engineOn, movetime, mode, playerColor, plyCount, cursor, screen, reviewing]);
}
