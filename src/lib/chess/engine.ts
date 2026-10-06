import type { EngineLine, Score } from "./types";
import { pvToSan } from "./helpers";

export type AnalyzeOptions = {
  movetime?: number;
  depth?: number;
  multipv?: number;
};

export type AnalyzeResult = {
  bestmove: string;
  ponder?: string;
  lines: EngineLine[];
};

type Pending = {
  resolve: (result: AnalyzeResult) => void;
  reject: (err: Error) => void;
  lines: Map<number, EngineLine>;
  fen: string;
};

function wasmOk(): boolean {
  try {
    return (
      typeof WebAssembly === "object" &&
      WebAssembly.validate(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00))
    );
  } catch {
    return false;
  }
}

function parseInfo(line: string, fen: string): EngineLine | null {
  if (!line.startsWith("info ") || !line.includes(" pv ")) return null;
  const mp = /multipv (\d+)/.exec(line);
  const depth = /depth (\d+)/.exec(line);
  const score = /score (cp|mate) (-?\d+)/.exec(line);
  const pvIdx = line.indexOf(" pv ");
  if (!depth || !score || pvIdx < 0) return null;
  const pv = line
    .slice(pvIdx + 4)
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (pv.length === 0) return null;
  const s: Score = { type: score[1] as "cp" | "mate", value: Number(score[2]) };
  return {
    multipv: mp ? Number(mp[1]) : 1,
    depth: Number(depth[1]),
    score: s,
    pv,
    san: pvToSan(fen, pv),
  };
}

export class StockfishEngine {
  private worker: Worker | null = null;
  private ready = false;
  private starting: Promise<void> | null = null;
  private pending: Pending | null = null;
  private searchId = 0;
  private listeners = new Set<(line: string) => void>();

  get isReady() {
    return this.ready;
  }

  async start(): Promise<void> {
    if (this.ready) return;
    if (this.starting) return this.starting;
    this.starting = this.boot();
    try {
      await this.starting;
    } finally {
      this.starting = null;
    }
  }

  private async boot(): Promise<void> {
    const src = wasmOk() ? "/engine/stockfish.wasm.js" : "/engine/stockfish.js";
    this.worker = new Worker(src);
    this.worker.addEventListener("message", (ev: MessageEvent<string>) => {
      const data = typeof ev.data === "string" ? ev.data : String(ev.data ?? "");
      this.onLine(data);
    });
    this.worker.addEventListener("error", (ev) => {
      this.pending?.reject(new Error(ev.message || "Engine worker error"));
      this.pending = null;
    });
    await this.waitFor("uci", (l) => l === "uciok", 12000);
    this.post("setoption name Hash value 32");
    this.post("setoption name MultiPV value 4");
    await this.waitFor("isready", (l) => l === "readyok", 8000);
    this.ready = true;
  }

  stop(): void {
    this.post("stop");
  }

  destroy(): void {
    this.ready = false;
    this.pending?.reject(new Error("Engine destroyed"));
    this.pending = null;
    this.worker?.terminate();
    this.worker = null;
  }

  async analyze(fen: string, opts: AnalyzeOptions = {}): Promise<AnalyzeResult> {
    await this.start();
    this.searchId += 1;
    const id = this.searchId;
    this.post("stop");
    const multipv = opts.multipv ?? 4;
    this.post(`setoption name MultiPV value ${multipv}`);
    this.post("ucinewgame");
    this.post(`position fen ${fen}`);
    const go = opts.depth
      ? `go depth ${opts.depth}`
      : `go movetime ${opts.movetime ?? 350}`;
    return new Promise<AnalyzeResult>((resolve, reject) => {
      if (id !== this.searchId) {
        reject(new Error("Superseded"));
        return;
      }
      this.pending = { resolve, reject, lines: new Map(), fen };
      this.post(go);
      window.setTimeout(() => {
        if (this.pending && id === this.searchId) {
          this.post("stop");
        }
      }, (opts.movetime ?? 350) + 2500);
    });
  }

  private post(cmd: string) {
    this.worker?.postMessage(cmd);
  }

  private onLine(line: string) {
    for (const fn of this.listeners) fn(line);
    if (!this.pending) return;
    const info = parseInfo(line, this.pending.fen);
    if (info) this.pending.lines.set(info.multipv, info);
    if (line.startsWith("bestmove")) {
      const parts = line.split(/\s+/);
      const bestmove = parts[1] && parts[1] !== "(none)" ? parts[1] : "";
      const ponder = parts[2] === "ponder" ? parts[3] : undefined;
      const lines = [...this.pending.lines.values()].sort((a, b) => a.multipv - b.multipv);
      const result = { bestmove, ponder, lines };
      this.pending.resolve(result);
      this.pending = null;
    }
  }

  private waitFor(cmd: string, pred: (l: string) => boolean, timeout: number) {
    return new Promise<void>((resolve, reject) => {
      const t = window.setTimeout(() => {
        this.listeners.delete(onLine);
        reject(new Error("Engine timeout"));
      }, timeout);
      const onLine = (l: string) => {
        if (!pred(l)) return;
        window.clearTimeout(t);
        this.listeners.delete(onLine);
        resolve();
      };
      this.listeners.add(onLine);
      this.post(cmd);
    });
  }
}

let singleton: StockfishEngine | null = null;

export function getEngine(): StockfishEngine {
  if (!singleton) singleton = new StockfishEngine();
  return singleton;
}
