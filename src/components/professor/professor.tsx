import Image from "next/image";
import { cn } from "@/lib/cn";
import { professorPoses, type ProfessorPose } from "@/lib/professor/poses";

/** Widths shrink on phones so the character never overwhelms the layout. */
const sizes = {
  sm: "w-24 sm:w-28",
  md: "w-32 sm:w-44",
  lg: "w-44 sm:w-56 lg:w-64",
  xl: "w-56 sm:w-72 lg:w-[22rem] xl:w-[26rem]",
} as const;

export type ProfessorSize = keyof typeof sizes;

type ProfessorProps = { pose: ProfessorPose; size?: ProfessorSize; className?: string };

/**
 * The site's guide character. Decorative, so it is hidden from screen readers.
 * While a pose PNG does not exist yet, a placeholder is shown in development only.
 */
export function Professor({ pose, size = "md", className }: ProfessorProps) {
  const config = professorPoses[pose];

  if (!config.available) {
    if (process.env.NODE_ENV === "production") {
      return null;
    }
    return (
      <div
        data-testid="professor-placeholder"
        aria-hidden="true"
        className={cn(
          "professor-animated flex aspect-[3/4] shrink-0 items-center justify-center rounded-2xl border-4 border-dashed",
          "border-violet bg-violet-soft p-3 text-center text-base font-extrabold text-ink",
          sizes[size],
          className,
        )}
      >
        Professor: {config.label}
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cn("professor-animated relative aspect-[3/4] shrink-0", sizes[size], className)}
    >
      <Image
        src={config.src}
        alt=""
        fill
        sizes="(min-width: 1280px) 416px, (min-width: 640px) 288px, 224px"
        className="object-contain"
      />
    </div>
  );
}
