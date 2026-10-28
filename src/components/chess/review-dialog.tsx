import { REVIEW_ORDER, reviewComplete, summarizeReview } from "@/lib/chess/review";
import { runReview } from "@/lib/chess/run-review";
import type { Classification, GameMode, Color } from "@/lib/chess/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useGame } from "@/store/game";

const LABEL: Record<Classification, string> = {
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

const MARK: Partial<Record<Classification, string>> = {
  brilliant: "!!",
  great: "!",
  inaccuracy: "?!",
  mistake: "?",
  blunder: "??",
};

const TONE: Record<Classification, string> = {
  brilliant: "text-brilliant",
  great: "text-great",
  best: "text-accent",
  excellent: "text-good",
  good: "text-muted",
  book: "text-subtle",
  inaccuracy: "text-inacc",
  mistake: "text-mistake",
  blunder: "text-blunder",
};

const NOTABLE = new Set<Classification>(["brilliant", "great", "inaccuracy", "mistake", "blunder"]);

function sideNames(mode: GameMode, playerColor: Color): { w: string; b: string; you: Color | null } {
  if (mode !== "play") return { w: "White", b: "Black", you: null };
  return playerColor === "w"
    ? { w: "You", b: "Villiance", you: "w" }
    : { w: "Villiance", b: "You", you: "b" };
}

function fmt(n: number | null): string {
  if (n === null || Number.isNaN(n)) return "—";
  return n.toFixed(1);
}

function moveName(index: number, san: string): string {
  const n = Math.floor(index / 2) + 1;
  return index % 2 === 0 ? `${n}. ${san}` : `${n}… ${san}`;
}

function EvalGraph({
  points,
  onPick,
}: {
  points: (number | null)[];
  onPick: (index: number) => void;
}) {
  const w = 320;
  const h = 76;
  const known = points.flatMap((p, i) => (p === null ? [] : [{ i, y: (p / 100) * h }]));
  const x = (i: number) => (points.length <= 1 ? w / 2 : (i / (points.length - 1)) * w);
  const line = known.map((p, n) => `${n === 0 ? "M" : "L"}${x(p.i).toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area =
    known.length > 1
      ? `${line} L${x(known[known.length - 1]!.i).toFixed(1)},0 L${x(known[0]!.i).toFixed(1)},0 Z`
      : "";

  return (
    <button
      type="button"
      className="relative h-[76px] w-full overflow-hidden rounded-[var(--radius-md)] bg-eval-b"
      aria-label="Evaluation over the game. Choose a moment to jump there."
      onClick={(e) => {
        if (points.length === 0) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const t = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        onPick(Math.round(t * (points.length - 1)));
      }}
    >
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-full w-full">
        {area && <path d={area} className="fill-eval-w" />}
        {line && <path d={line} className="fill-none stroke-mistake" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />}
        {known.map((p) => (
          <circle key={p.i} cx={x(p.i)} cy={p.y} r="2.2" className="fill-mistake" />
        ))}
      </svg>
    </button>
  );
}

export function ReviewDialog() {
  const open = useGame((s) => s.reviewOpen);
  const plies = useGame((s) => s.plies);
  const startEval = useGame((s) => s.startEval);
  const mode = useGame((s) => s.mode);
  const playerColor = useGame((s) => s.playerColor);
  const reviewing = useGame((s) => s.reviewing);
  const progress = useGame((s) => s.reviewProgress);
  const opening = useGame((s) => s.opening);
  const review = summarizeReview(plies, startEval);
  const names = sideNames(mode, playerColor);
  const done = reviewComplete(plies, startEval);
  const moments = plies.flatMap((ply, i) =>
    ply.classification && NOTABLE.has(ply.classification) ? [{ i, ply }] : [],
  );

  const jump = (cursor: number) => {
    useGame.getState().goto(cursor);
    useGame.getState().setReviewOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => useGame.getState().setReviewOpen(v)}>
      <DialogContent className="max-h-[88dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review</DialogTitle>
          <DialogDescription>{opening ?? "This game"}</DialogDescription>
        </DialogHeader>

        <EvalGraph points={review.graph} onPick={jump} />

        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          <ScoreBlock name={names.w} value={fmt(review.w.accuracy)} light={names.you !== "b"} />
          <p className="pb-2 text-[11px] font-medium tracking-wide text-subtle uppercase">Accuracy</p>
          <ScoreBlock name={names.b} value={fmt(review.b.accuracy)} light={names.you === "b"} />
        </div>

        <div className="mt-4 flex flex-col gap-1">
          {REVIEW_ORDER.map((key) => (
            <div key={key} className="grid grid-cols-[minmax(0,1fr)_2.4rem_1.6rem_2.4rem] items-center gap-1 text-sm">
              <span className="text-muted">{LABEL[key]}</span>
              <span className={cn("text-right font-mono text-sm tabular-nums", TONE[key])}>{review.w.counts[key]}</span>
              <span className={cn("text-center font-mono text-xs", TONE[key])}>{MARK[key] ?? ""}</span>
              <span className={cn("text-left font-mono text-sm tabular-nums", TONE[key])}>{review.b.counts[key]}</span>
            </div>
          ))}
        </div>

        {plies.length > 0 && !done && (
          <p className="mt-3 text-xs text-subtle">
            {review.scored} of {review.total} moves have an eval
            {review.classified < review.total ? `, ${review.classified} are labeled` : ""}.
          </p>
        )}

        {plies.length === 0 ? (
          <p className="mt-4 text-sm text-muted">Play a few moves, then review the game.</p>
        ) : (
          <Button
            className="mt-4 w-full"
            variant={done ? "outline" : "default"}
            disabled={reviewing}
            onClick={() => void runReview(done)}
          >
            {reviewing ? `Analyzing ${progress} / ${plies.length + 1}` : done ? "Analyze again" : "Analyze game"}
          </Button>
        )}

        {moments.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-medium tracking-wide text-subtle uppercase">Moments</p>
            <ul className="flex flex-col gap-1">
              {moments.map(({ i, ply }) => (
                <li key={`${ply.uci}-${i}`}>
                  <button
                    type="button"
                    onClick={() => jump(i + 1)}
                    className="flex h-11 w-full items-center justify-between rounded-[var(--radius-sm)] px-2 text-left hover:bg-surface-2"
                  >
                    <span className="font-mono text-sm">{moveName(i, ply.san)}</span>
                    <span className={cn("font-mono text-xs", ply.classification && TONE[ply.classification])}>
                      {ply.classification ? LABEL[ply.classification] : ""}
                      {ply.classification && MARK[ply.classification] ? ` ${MARK[ply.classification]}` : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ScoreBlock({ name, value, light }: { name: string; value: string; light: boolean }) {
  return (
    <div>
      <p className="mb-1.5 truncate text-center text-sm">{name}</p>
      <p
        className={cn(
          "rounded-[var(--radius-md)] py-2 text-center font-display text-3xl tabular-nums",
          light ? "bg-accent text-accent-fg" : "bg-surface-2 text-fg",
        )}
      >
        {value}
      </p>
    </div>
  );
}
