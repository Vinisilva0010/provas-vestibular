import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type ButtonVariant = "primary" | "secondary";

const base =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-card border-2 border-ink px-6 py-3 " +
  "text-lg font-extrabold text-ink no-underline shadow-card " +
  "transition-[transform,box-shadow] duration-150 ease-out " +
  "hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-card-hover " +
  "active:translate-x-1 active:translate-y-1 active:shadow-none " +
  "disabled:cursor-not-allowed disabled:border-dashed disabled:shadow-none";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-coral",
  secondary: "bg-paper",
};

export function buttonClasses(variant: ButtonVariant = "primary"): string {
  return cn(base, variants[variant]);
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant };

export function Button({ variant = "primary", type = "button", className, ...props }: ButtonProps) {
  return <button type={type} className={cn(buttonClasses(variant), className)} {...props} />;
}

type ButtonLinkProps = ComponentProps<typeof Link> & { variant?: ButtonVariant };

export function ButtonLink({ variant = "primary", className, ...props }: ButtonLinkProps) {
  return <Link className={cn(buttonClasses(variant), className)} {...props} />;
}
