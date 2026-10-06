import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide uppercase",
  {
    variants: {
      tone: {
        brilliant: "bg-brilliant/15 text-brilliant",
        great: "bg-great/15 text-great",
        best: "bg-accent/12 text-accent",
        excellent: "bg-good/15 text-good",
        good: "bg-good/12 text-muted",
        book: "bg-surface-2 text-muted",
        inaccuracy: "bg-inacc/15 text-inacc",
        mistake: "bg-mistake/15 text-mistake",
        blunder: "bg-blunder/18 text-blunder",
        muted: "bg-surface-2 text-muted",
      },
    },
    defaultVariants: { tone: "muted" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
