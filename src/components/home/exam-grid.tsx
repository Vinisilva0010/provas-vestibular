import Link from "next/link";
import { Arrow, Book } from "@/components/art/doodles";
import { CurtainReveal } from "@/components/motion/curtain-reveal";
import { Professor } from "@/components/professor/professor";
import { cn } from "@/lib/cn";
import { featuredExams, type ExamTone } from "@/lib/featured-exams";

const tones: Record<ExamTone, string> = {
  sun: "bg-sun",
  coral: "bg-coral",
  violet: "bg-violet-soft",
  paper: "bg-paper",
};

const tilts = ["-rotate-1", "rotate-2", "-rotate-2", "rotate-1", "rotate-0", "-rotate-1", "rotate-2"];

export function ExamGrid() {
  return (
    <section className="mx-auto max-w-7xl px-5 pt-20">
      <div className="flex flex-col-reverse gap-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="display-type text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.9]">
            Sete provas com plano de estudo
          </h2>
          <p className="mt-4 text-xl">
            Para estas, além de datas e regras, o site monta um plano semana a semana até o dia da
            prova. As outras provas têm todas as informações, sem plano.
          </p>
        </div>
        <Professor pose="sitting" size="lg" className="self-center sm:self-end" />
      </div>

      <CurtainReveal className="mt-14">
        <ul className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {featuredExams.map((exam, index) => {
            const isLead = index === 0;
            return (
              <li key={exam.slug} className={cn(isLead && "sm:col-span-2 lg:col-span-1 lg:row-span-2")}>
                <Link
                  href={`/provas/${exam.slug}`}
                  className={cn(
                    "group relative flex h-full min-h-48 flex-col justify-between gap-6 overflow-hidden rounded-2xl border-4 border-ink p-6 no-underline shadow-card",
                    "transition-[transform,box-shadow,rotate] duration-200 ease-out hover:-translate-y-1.5 hover:rotate-0 hover:shadow-card-hover",
                    tones[exam.tone],
                    tilts[index % tilts.length],
                  )}
                >
                  {isLead && <Book className="absolute -top-2 -right-6 w-40 rotate-12 sm:w-48" />}
                  <span
                    className={cn(
                      "display-type relative leading-[0.9]",
                      isLead ? "text-8xl lg:mt-24 lg:text-9xl" : "text-6xl",
                    )}
                  >
                    {exam.name}
                  </span>
                  <span className="relative flex items-end justify-between gap-4 text-lg font-extrabold">
                    {exam.summary}
                    <Arrow className="w-14 shrink-0 transition-transform duration-200 group-hover:translate-x-1.5" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </CurtainReveal>
    </section>
  );
}
