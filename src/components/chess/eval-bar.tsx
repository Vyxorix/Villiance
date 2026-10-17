import { evalToWhitePct, formatScore } from "@/lib/chess/helpers";
import { cn } from "@/lib/utils";
import { useGame } from "@/store/game";

export function EvalBar({ orientation, horizontal }: { orientation: "w" | "b"; horizontal?: boolean }) {
  const score = useGame((s) => s.evalScore);
  const thinking = useGame((s) => s.thinking);
  const lines = useGame((s) => s.lines);
  const pct = evalToWhitePct(score);
  const whiteFrac = orientation === "w" ? pct : 1 - pct;
  const label = formatScore(score);
  const depth = lines[0]?.depth;

  if (horizontal) {
    return (
      <div className="relative h-8 w-full overflow-hidden rounded-[var(--radius-sm)] bg-eval-b">
        <div
          className="absolute inset-y-0 bg-eval-w transition-[width,left,right] duration-300"
          style={
            orientation === "w"
              ? { left: 0, width: `${pct * 100}%` }
              : { right: 0, width: `${pct * 100}%` }
          }
        />
        <span
          className={cn(
            "absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-[var(--radius-xs)] bg-surface px-1.5 py-0.5 font-mono text-xs tabular-nums text-fg",
            thinking && "opacity-70",
          )}
        >
          {label}
          {depth ? <span className="ml-1 text-subtle">d{depth}</span> : null}
        </span>
      </div>
    );
  }

  return (
    <div className="flex h-full w-12 flex-col items-center">
      <div className="relative min-h-0 w-full flex-1 overflow-hidden rounded-[var(--radius-sm)] bg-eval-b">
        <div
          className="absolute inset-x-0 bottom-0 bg-eval-w transition-[height] duration-300"
          style={{ height: `${whiteFrac * 100}%` }}
        />
      </div>
      <p className={cn("mt-1 font-mono text-xs tabular-nums text-fg", thinking && "opacity-70")}>
        {label}
      </p>
      {depth ? <p className="font-mono text-xs text-subtle">d{depth}</p> : null}
    </div>
  );
}