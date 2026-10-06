import { useEffect, useRef } from "react";
import { getEngine } from "@/lib/chess/engine";
import { useGame } from "@/store/game";

export function useEngineBridge() {
  const startFen = useGame((s) => s.startFen);
  const cursor = useGame((s) => s.cursor);
  const plyFen = useGame((s) => s.plies[s.cursor - 1]?.fenAfter);
  const engineOn = useGame((s) => s.engineOn);
  const movetime = useGame((s) => s.movetime);
  const mode = useGame((s) => s.mode);
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
    if (!engineOn) {
      useGame.setState({ thinking: false, lines: [], brilliant: null });
      return;
    }
    const id = ++gen.current;
    const engine = getEngine();
    useGame.getState().setThinking(true);
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
        }
      } catch {
        if (id === gen.current) useGame.getState().setThinking(false);
      }
    })();
    return () => {
      engine.stop();
      if (playTimer) window.clearTimeout(playTimer);
    };
  }, [fen, engineOn, movetime, mode, playerColor, plyCount, cursor]);
}
