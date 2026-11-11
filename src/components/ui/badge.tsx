import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type BadgeTone = "sun" | "coral" | "violet" | "paper";

const tones: Record<BadgeTone, string> = {
  sun: "border-ink bg-sun",
  coral: "border-ink bg-coral",
  violet: "border-violet bg-violet-soft",
  paper: "border-ink bg-paper",
};

type BadgeProps = { tone?: BadgeTone; className?: string; children: ReactNode };

export function Badge({ tone = "sun", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border-2 px-3 py-0.5 text-base font-extrabold text-ink",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
