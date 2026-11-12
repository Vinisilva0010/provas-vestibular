import { Badge } from "@/components/ui/badge";
import { Card, type CardTone } from "@/components/ui/card";
import type { ExamStructure } from "@/lib/data/schemas";
import { phaseFacts } from "@/lib/exam-view";
import { phaseFormatLabel } from "@/lib/labels";
import { BulletList } from "./bullet-list";
import { EmptyState } from "./empty-state";
import { SourceNotes } from "./source-notes";

const phaseTones: CardTone[] = ["sun", "coral", "violet"];

export function StructureTab({ structure }: { structure?: ExamStructure }) {
  if (!structure) {
    return <EmptyState text="A estrutura desta edição ainda não foi cadastrada." />;
  }

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-3">
        {structure.phases.map((phase, index) => (
          <Card key={phase.key} tone={phaseTones[index % phaseTones.length]}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="display-type text-4xl leading-none">{phase.label}</h3>
              <Badge tone="paper">{phaseFormatLabel[phase.format]}</Badge>
            </div>
            <ul className="mt-4 flex flex-wrap gap-2">
              {phaseFacts(phase).map((fact) => (
                <li key={fact} className="rounded-lg border-2 border-ink bg-paper px-2 py-0.5 text-base font-extrabold">
                  {fact}
                </li>
              ))}
            </ul>
            <h4 className="mt-5 text-lg font-extrabold">O que cai</h4>
            <ul className="mt-2 flex flex-wrap gap-2">
              {phase.subjects.map((subject) => (
                <li key={subject} className="rounded-full border-2 border-ink bg-paper px-3 py-0.5 text-base">
                  {subject}
                </li>
              ))}
            </ul>
            {phase.notes && (
              <div className="mt-5">
                <BulletList items={phase.notes} />
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="mt-14 grid gap-12 lg:grid-cols-2">
        <section>
          <h3 className="display-type text-4xl leading-none">Como a nota é calculada</h3>
          <div className="mt-5">
            <BulletList items={structure.scoring} />
          </div>
        </section>
        {structure.eliminationRules && (
          <section>
            <h3 className="display-type text-4xl leading-none">O que elimina</h3>
            <div className="mt-5">
              <BulletList items={structure.eliminationRules} />
            </div>
          </section>
        )}
      </div>

      {structure.quotas && (
        <section className="mt-14">
          <h3 className="display-type text-4xl leading-none">Modalidades de vaga</h3>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {structure.quotas.map((quota) => (
              <Card key={quota.key}>
                <h4 className="text-xl font-extrabold">{quota.label}</h4>
                <p className="mt-2 text-lg">{quota.description}</p>
              </Card>
            ))}
          </div>
        </section>
      )}

      {structure.tieBreak && (
        <section className="mt-14">
          <h3 className="display-type text-4xl leading-none">Desempate</h3>
          <p className="mt-4 text-xl">{structure.tieBreak}</p>
        </section>
      )}

      {structure.accessibility && (
        <section className="mt-14">
          <h3 className="display-type text-4xl leading-none">Acessibilidade</h3>
          <div className="mt-5">
            <BulletList items={structure.accessibility} />
          </div>
        </section>
      )}

      <SourceNotes sources={[structure]} />
    </div>
  );
}
