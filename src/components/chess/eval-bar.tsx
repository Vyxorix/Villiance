import { evalToWhitePct, formatScore } from "@/lib/chess/helpers";
import { cn } from "@/lib/utils";
import { useGame } from "@/store/game";

export function EvalBar({ orientation, horizontal }: { orientation: "w" | "b"; horizontal?: boolean }) {
  const score = useGame((s) => s.evalScore);
  const thinking = useGame((s) => s.thinking);
  const pct = evalToWhitePct(score);
  const whiteFrac = orientation === "w" ? pct : 1 - pct;
  const label = formatScore(score);

  if (horizontal) {
    return (
      <div className="relative h-7 w-full overflow-hidden rounded-[var(--radius-sm)] bg-eval-b">
        <div
          className="absolute inset-y-0 left-0 bg-eval-w transition-[width] duration-300"
          style={{ width: `${pct * 100}%` }}
        />
        <span
          className={cn(
            "relative z-10 flex h-full items-center justify-center font-mono text-[11px] tabular-nums",
            pct > 0.5 ? "text-accent-fg" : "text-fg",
            thinking && "opacity-70",
          )}
        >
          {label}
        </span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-7 overflow-hidden rounded-[var(--radius-sm)] bg-eval-b">
      <div
        className="absolute inset-x-0 bottom-0 bg-eval-w transition-[height] duration-300"
        style={{ height: `${whiteFrac * 100}%` }}
      />
      <span
        className={cn(
          "relative z-10 flex h-full items-center justify-center font-mono text-[10px] tabular-nums",
          "rotate-180 [writing-mode:vertical-rl]",
          whiteFrac > 0.45 ? "text-accent-fg" : "text-fg",
        )}
      >
        {label}
      </span>
    </div>
  );
}
