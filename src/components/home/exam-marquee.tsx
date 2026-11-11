import { Star } from "@/components/art/doodles";
import { cn } from "@/lib/cn";
import { coveredExamNames } from "@/lib/featured-exams";

function MarqueeRow({ hidden }: { hidden: boolean }) {
  return (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center gap-8 pr-8">
      {coveredExamNames.map((name, index) => (
        <li key={name} className="flex items-center gap-8">
          <span className={cn("display-type text-5xl sm:text-6xl", index % 2 === 1 && "text-outline")}>
            {name}
          </span>
          <Star className="size-8 shrink-0" />
        </li>
      ))}
    </ul>
  );
}

export function ExamMarquee() {
  return (
    <div className="overflow-x-clip py-8">
      <section
        aria-label="Provas e programas que o site cobre"
        className="-mx-4 -rotate-2 border-y-4 border-ink bg-coral py-4 shadow-[0_8px_0_0_var(--color-ink)]"
      >
        <div className="marquee flex w-max">
          <MarqueeRow hidden={false} />
          <MarqueeRow hidden />
        </div>
      </section>
    </div>
  );
}
