import type { ComponentType } from "react";
import { Book, Calendar, Pencil, type DoodleProps } from "@/components/art/doodles";
import { Professor } from "@/components/professor/professor";
import { cn } from "@/lib/cn";

type Step = { title: string; text: string; Art: ComponentType<DoodleProps>; tone: string };

const steps: Step[] = [
  {
    title: "Escolha a prova",
    text: "Veja como ela funciona, quanto custa a inscrição e o que cai em cada matéria.",
    Art: Book,
    tone: "bg-violet-soft",
  },
  {
    title: "Salve as datas",
    text: "Coloque inscrição, dias de prova e resultado direto no calendário do celular.",
    Art: Calendar,
    tone: "bg-coral-soft",
  },
  {
    title: "Siga o plano",
    text: "Uma tarefa por dia, com questões de provas antigas e revisão do que já estudou.",
    Art: Pencil,
    tone: "bg-sun-soft",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-5 pt-28">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
        <Professor pose="point-right" size="lg" />
        <div>
          <h2 className="display-type text-[clamp(2.75rem,7vw,5.5rem)] leading-[0.9]">
            Como usar o site
          </h2>
          <p className="mt-4 max-w-xl text-xl">Três passos, do primeiro dia até a prova.</p>
        </div>
      </div>

      <ol className="mt-20 grid gap-20 lg:grid-cols-3 lg:gap-7">
        {steps.map(({ title, text, Art, tone }, index) => (
          <li key={title} className={cn("relative", index === 1 && "lg:mt-16", index === 2 && "lg:mt-32")}>
            <span
              aria-hidden="true"
              className="display-type text-outline pointer-events-none absolute -top-16 -left-1 text-[8rem] leading-none"
            >
              {index + 1}
            </span>
            <div className={cn("relative rounded-2xl border-4 border-ink p-6 shadow-card", tone)}>
              <Art className="h-20 w-auto" />
              <h3 className="display-type mt-5 text-4xl leading-none">{title}</h3>
              <p className="mt-3 text-lg">{text}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
