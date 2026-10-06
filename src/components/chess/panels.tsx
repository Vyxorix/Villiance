import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ClipboardCopy,
  FlipVertical2,
  Lightbulb,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { capturedPieces, formatScore, pieceSrc, statusText } from "@/lib/chess/helpers";
import { STUDIES } from "@/lib/chess/studies";
import { cn } from "@/lib/utils";
import { useGame, usePosition } from "@/store/game";
import type { Classification } from "@/lib/chess/types";

const CLASS_LABEL: Record<Classification, string> = {
  brilliant: "Brilliant",
  great: "Great",
  best: "Best",
  excellent: "Excellent",
  good: "Good",
  book: "Book",
  inaccuracy: "Inaccuracy",
  mistake: "Mistake",
  blunder: "Blunder",
};

export function GameToolbar() {
  const cursor = useGame((s) => s.cursor);
  const len = useGame((s) => s.plies.length);
  const sound = useGame((s) => s.sound);
  const engineOn = useGame((s) => s.engineOn);
  const thinking = useGame((s) => s.thinking);
  const brilliant = useGame((s) => s.brilliant);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Button variant="ghost" size="icon-sm" aria-label="Start" onClick={() => useGame.getState().goto(0)}>
        <ChevronsLeft className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Back"
        disabled={cursor <= 0}
        onClick={() => useGame.getState().goto(cursor - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Forward"
        disabled={cursor >= len}
        onClick={() => useGame.getState().goto(cursor + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="End" onClick={() => useGame.getState().goto(len)}>
        <ChevronsRight className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Take back" onClick={() => useGame.getState().takeback()}>
        <RotateCcw className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" aria-label="Flip board" onClick={() => useGame.getState().flip()}>
        <FlipVertical2 className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={sound ? "Mute" : "Unmute"}
        onClick={() => useGame.getState().setSound(!sound)}
      >
        {sound ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
      </Button>
      <div className="ml-auto flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={!brilliant || thinking}
          onClick={() => useGame.getState().playHint()}
        >
          <Lightbulb className="size-3.5" />
          Play line
        </Button>
        <Button
          variant={engineOn ? "secondary" : "outline"}
          size="sm"
          onClick={() => useGame.getState().setEngineOn(!engineOn)}
        >
          {engineOn ? "Engine on" : "Engine off"}
        </Button>
      </div>
    </div>
  );
}

export function CapturedRow() {
  const chess = usePosition();
  const missing = capturedPieces(chess);
  return (
    <div className="flex items-center justify-between gap-3 text-xs text-muted">
      <div className="flex min-h-6 flex-wrap items-center gap-0.5">
        {missing.b.map((t, i) => (
          <img key={`b${t}${i}`} src={pieceSrc("b", t)} alt="" className="h-5 w-5 opacity-80" />
        ))}
      </div>
      <div className="flex min-h-6 flex-wrap items-center justify-end gap-0.5">
        {missing.w.map((t, i) => (
          <img key={`w${t}${i}`} src={pieceSrc("w", t)} alt="" className="h-5 w-5 opacity-80" />
        ))}
      </div>
    </div>
  );
}

export function MoveList() {
  const plies = useGame((s) => s.plies);
  const cursor = useGame((s) => s.cursor);
  const pairs: { n: number; w?: (typeof plies)[0]; b?: (typeof plies)[0]; wi: number; bi?: number }[] = [];
  for (let i = 0; i < plies.length; i += 2) {
    pairs.push({ n: i / 2 + 1, w: plies[i], b: plies[i + 1], wi: i + 1, bi: plies[i + 1] ? i + 2 : undefined });
  }

  return (
    <ScrollArea className="h-48 lg:h-56">
      {plies.length === 0 ? (
        <p className="px-1 py-6 text-center text-sm text-muted">No moves yet. Play, or load a study.</p>
      ) : (
        <ol className="flex flex-col gap-0.5 pr-2">
          {pairs.map((row) => (
            <li key={row.n} className="grid grid-cols-[2rem_1fr_1fr] items-center gap-1 text-sm">
              <span className="font-mono text-xs text-subtle tabular-nums">{row.n}.</span>
              {row.w && (
                <MoveBtn
                  active={cursor === row.wi}
                  san={row.w.san}
                  cls={row.w.classification}
                  onClick={() => useGame.getState().goto(row.wi)}
                />
              )}
              {row.b && row.bi !== undefined && (
                <MoveBtn
                  active={cursor === row.bi}
                  san={row.b.san}
                  cls={row.b.classification}
                  onClick={() => useGame.getState().goto(row.bi as number)}
                />
              )}
            </li>
          ))}
        </ol>
      )}
    </ScrollArea>
  );
}

function MoveBtn({
  san,
  cls,
  active,
  onClick,
}: {
  san: string;
  cls?: Classification;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-8 items-center justify-between rounded-[var(--radius-xs)] px-2 text-left font-medium",
        active ? "bg-surface-2 text-fg" : "text-fg/90 hover:bg-surface-2/60",
      )}
    >
      <span>{san}</span>
      {cls && cls !== "good" && cls !== "book" && (
        <span
          className={cn(
            "ml-1 size-1.5 rounded-full",
            cls === "brilliant" && "bg-brilliant",
            cls === "great" && "bg-great",
            cls === "best" && "bg-accent",
            cls === "excellent" && "bg-good",
            cls === "inaccuracy" && "bg-inacc",
            cls === "mistake" && "bg-mistake",
            cls === "blunder" && "bg-blunder",
          )}
        />
      )}
    </button>
  );
}

export function EnginePanel() {
  const ready = useGame((s) => s.engineReady);
  const thinking = useGame((s) => s.thinking);
  const lines = useGame((s) => s.lines);
  const brilliant = useGame((s) => s.brilliant);
  const evalScore = useGame((s) => s.evalScore);
  const movetime = useGame((s) => s.movetime);
  const opening = useGame((s) => s.opening);
  const chess = usePosition();
  const status = statusText(chess);
  const turn = chess.turn();

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium tracking-wide text-subtle uppercase">Opening</p>
            <p className="mt-0.5 font-display text-lg leading-snug">{opening ?? "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium tracking-wide text-subtle uppercase">Eval</p>
            <p className="mt-0.5 font-mono text-lg tabular-nums">{formatScore(evalScore)}</p>
          </div>
        </div>
        {status && <p className="mt-2 text-sm text-brilliant">{status}</p>}
        {!ready && <p className="mt-2 text-sm text-muted">Waking Stockfish…</p>}
        {ready && thinking && <p className="mt-2 text-sm text-muted">Searching forcing lines…</p>}
      </div>

      {brilliant && (
        <div className="rounded-[var(--radius-lg)] border border-brilliant/30 bg-brilliant/10 p-4">
          <div className="flex items-center gap-2">
            <Badge tone={brilliant.sacrifice || brilliant.mate ? "brilliant" : "best"}>
              {brilliant.sacrifice || brilliant.mate ? "Brilliant line" : "Best line"}
            </Badge>
            <span className="font-mono text-sm tabular-nums">{brilliant.san}</span>
          </div>
          <p className="mt-2 text-sm text-fg/90">{brilliant.reason}</p>
          {brilliant.pvSan.length > 1 && (
            <p className="mt-2 font-mono text-xs leading-relaxed text-muted">{brilliant.pvSan.slice(0, 10).join(" ")}</p>
          )}
        </div>
      )}

      <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
        <p className="mb-2 text-[11px] font-medium tracking-wide text-subtle uppercase">Engine lines</p>
        {lines.length === 0 ? (
          <p className="text-sm text-muted">{ready ? "No lines yet." : "Engine loading."}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {lines.slice(0, 4).map((line) => (
              <li key={line.multipv} className="flex gap-3 text-sm">
                <span className="w-10 shrink-0 font-mono text-xs tabular-nums text-muted">
                  {formatScore(turn === "w" ? line.score : { type: line.score.type, value: -line.score.value })}
                </span>
                <span className="min-w-0 font-mono text-xs leading-relaxed text-fg/90">
                  {line.san.slice(0, 8).join(" ")}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-muted">
            <span>Think time</span>
            <span className="font-mono tabular-nums">{movetime} ms</span>
          </div>
          <Slider
            min={120}
            max={1200}
            step={20}
            value={[movetime]}
            onValueChange={(v) => useGame.getState().setMovetime(v[0] ?? 350)}
          />
        </div>
      </div>
    </div>
  );
}

export function StudiesPanel() {
  const studyId = useGame((s) => s.studyId);
  const solved = useGame((s) => s.studySolved);
  const miss = useGame((s) => s.studyMiss);
  const active = STUDIES.find((s) => s.id === studyId);

  return (
    <div className="flex flex-col gap-3">
      {active && (
        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-4">
          <p className="font-display text-lg">{active.title}</p>
          <p className="mt-1 text-xs text-muted">{active.source}</p>
          {solved ? (
            <p className="mt-3 text-sm text-brilliant">{active.idea}</p>
          ) : miss ? (
            <p className="mt-3 text-sm text-mistake">Not the sacrificial blow. Keep looking, or play the hinted line.</p>
          ) : (
            <p className="mt-3 text-sm text-muted">Find the forcing sacrifice. One move starts the combination.</p>
          )}
        </div>
      )}
      <ul className="flex flex-col gap-1.5">
        {STUDIES.map((st) => (
          <li key={st.id}>
            <button
              type="button"
              onClick={() => useGame.getState().loadStudy(st.id)}
              className={cn(
                "flex w-full flex-col items-start rounded-[var(--radius-md)] border border-border px-3 py-2.5 text-left hover:bg-surface-2",
                studyId === st.id && "border-brilliant/40 bg-brilliant/10",
              )}
            >
              <span className="text-sm font-medium">{st.title}</span>
              <span className="text-xs text-muted">{st.source}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function NewGameBar() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" onClick={() => useGame.getState().newGame({ color: "w", mode: "play" })}>
        Play white
      </Button>
      <Button size="sm" variant="secondary" onClick={() => useGame.getState().newGame({ color: "b", mode: "play" })}>
        Play black
      </Button>
      <Button size="sm" variant="outline" onClick={() => useGame.getState().newGame({ color: "w", mode: "analyze" })}>
        Analyze
      </Button>
      <Button size="sm" variant="ghost" onClick={() => useGame.getState().setImportOpen(true)}>
        Import
      </Button>
      <Button
        size="icon-sm"
        variant="ghost"
        aria-label="Copy PGN"
        onClick={async () => {
          const pgn = useGame.getState().pgn();
          await navigator.clipboard.writeText(pgn || "(empty)");
          toast("PGN copied");
        }}
      >
        <ClipboardCopy className="size-4" />
      </Button>
    </div>
  );
}

export function ImportDialog() {
  const open = useGame((s) => s.importOpen);
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={(v) => useGame.getState().setImportOpen(v)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Load a game</DialogTitle>
          <DialogDescription>Paste PGN or a FEN string. Analysis starts immediately.</DialogDescription>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="1. e4 e5 …  or  rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"
        />
        {err && <p className="mt-2 text-sm text-blunder">{err}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => useGame.getState().setImportOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const raw = text.trim();
              if (!raw) return;
              const looksFen = raw.split("/").length >= 7 && !raw.includes(".");
              const msg = looksFen ? useGame.getState().loadFen(raw) : useGame.getState().loadPgn(raw);
              if (msg) setErr(msg);
              else {
                setErr(null);
                setText("");
              }
            }}
          >
            Load
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ClassificationKey() {
  const cursor = useGame((s) => s.cursor);
  const ply = useGame((s) => s.plies[s.cursor - 1]);
  if (!ply?.classification || cursor === 0) return null;
  return (
    <div className="flex items-center gap-2">
      <Badge tone={ply.classification}>{CLASS_LABEL[ply.classification]}</Badge>
      <span className="text-sm text-muted">{ply.san}</span>
    </div>
  );
}
