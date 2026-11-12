import { Card, type CardTone } from "@/components/ui/card";
import type { Edition, Exam } from "@/lib/data/schemas";
import { formatCurrencyCents, formatNumber } from "@/lib/format";
import { examFormatLabel, regionLabel } from "@/lib/labels";
import { SourceNotes } from "./source-notes";

type Fact = { title: string; value: string; note?: string; tone: CardTone };

export function OverviewTab({ exam, edition }: { exam: Exam; edition?: Edition }) {
  const facts: Fact[] = [
    { title: "Formato", value: examFormatLabel[exam.examFormat], tone: "sun" },
    {
      title: "Vagas",
      value: edition?.vacanciesApprox ? `Cerca de ${formatNumber(edition.vacanciesApprox)}` : "Ainda não divulgado",
      note: edition?.vacanciesNote,
      tone: "coral",
    },
    {
      title: "Taxa de inscrição",
      value: edition?.feeCents !== undefined ? formatCurrencyCents(edition.feeCents) : "Ainda não divulgada",
      note: edition?.feeNote,
      tone: "violet",
    },
    { title: "Onde", value: exam.states.map(regionLabel).join(", "), tone: "paper" },
  ];

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((fact) => (
          <Card key={fact.title} tone={fact.tone}>
            <p className="text-base font-extrabold">{fact.title}</p>
            <p className="display-type mt-2 text-3xl leading-none">{fact.value}</p>
            {fact.note && <p className="mt-2 text-base">{fact.note}</p>}
          </Card>
        ))}
      </div>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
        <section>
          <h3 className="display-type text-4xl leading-none">Como funciona</h3>
          <p className="mt-4 text-xl">{edition?.howItWorks ?? exam.summary}</p>
        </section>
        <section>
          <h3 className="display-type text-4xl leading-none">Para quem é</h3>
          <p className="mt-4 text-xl">{exam.audience}</p>
          <h3 className="display-type mt-8 text-4xl leading-none">Quem organiza</h3>
          <p className="mt-4 text-xl">{exam.institution}</p>
        </section>
      </div>

      <SourceNotes sources={edition ? [exam, edition] : [exam]} />
    </div>
  );
}
