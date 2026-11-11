import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type CardTone = "paper" | "sun" | "coral" | "violet";

const tones: Record<CardTone, string> = {
  paper: "bg-paper",
  sun: "bg-sun-soft",
  coral: "bg-coral-soft",
  violet: "bg-violet-soft",
};

type CardProps = ComponentProps<"article"> & { tone?: CardTone; interactive?: boolean };

export function Card({ tone = "paper", interactive = false, className, ...props }: CardProps) {
  return (
    <article
      className={cn(
        "rounded-card border-2 border-ink p-6 text-ink shadow-card",
        tones[tone],
        interactive &&
          "transition-[transform,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:shadow-card-hover",
        className,
      )}
      {...props}
    />
  );
}
