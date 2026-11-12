import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCalendar } from "@/components/exam/add-to-calendar";
import { CalendarTab } from "@/components/exam/calendar-tab";
import { DocumentsTab } from "@/components/exam/documents-tab";
import { NextDates } from "@/components/exam/next-dates";
import { OverviewTab } from "@/components/exam/overview-tab";
import { StructureTab } from "@/components/exam/structure-tab";
import { Professor } from "@/components/professor/professor";
import { Badge } from "@/components/ui/badge";
import { ButtonLink, buttonClasses } from "@/components/ui/button";
import { Tabs } from "@/components/ui/tabs";
import { getDataset } from "@/lib/data/get-dataset";
import { buildExamView } from "@/lib/exam-view";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const dataset = await getDataset();
  return dataset.exams.map((exam) => ({ slug: exam.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const view = buildExamView(await getDataset(), slug);
  if (!view) return { title: "Prova não encontrada" };
  return {
    title: `${view.exam.shortName}: datas, como é a prova e documentos oficiais`,
    description: view.exam.summary,
  };
}

export default async function ExamPage({ params }: Props) {
  const { slug } = await params;
  const view = buildExamView(await getDataset(), slug);
  if (!view) notFound();

  const { exam, edition, structure, events, editionYear, dateItems } = view;

  return (
    <main>
      <section className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pt-10 lg:grid-cols-[1.25fr_1fr] lg:pt-14">
        <div>
          <div className="flex flex-wrap gap-3">
            {editionYear && (
              <Badge tone="coral" className="-rotate-2 text-lg">
                Para entrar em {editionYear}
              </Badge>
            )}
            {exam.hasStudyPlan && <Badge className="rotate-1 text-lg">Tem plano de estudo</Badge>}
          </div>
          <h1 className="display-type mt-6 text-[clamp(4rem,14vw,10rem)] leading-[0.82]">{exam.shortName}</h1>
          <p className="mt-4 text-2xl font-extrabold">{exam.officialName}</p>
          <p className="mt-3 max-w-2xl text-xl">{exam.summary}</p>
          <div className="mt-7 flex flex-wrap gap-4">
            <a href={exam.officialSiteUrl} target="_blank" rel="noopener noreferrer" className={buttonClasses()}>
              Site oficial
            </a>
            <AddToCalendar examName={exam.shortName} examSlug={exam.slug} items={dateItems} />
            <ButtonLink href="/provas" variant="secondary">
              Outras provas
            </ButtonLink>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div
            aria-hidden="true"
            className="absolute -top-6 right-0 hidden aspect-square w-64 rounded-full border-4 border-ink bg-sun sm:block"
          />
          <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-end">
            <Professor pose="point-left" size="lg" />
            <NextDates items={dateItems} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-16">
        <Tabs
          label={`Informações da ${exam.shortName}`}
          items={[
            { id: "visao-geral", label: "Visão geral", content: <OverviewTab exam={exam} edition={edition} /> },
            { id: "calendario", label: "Calendário", content: <CalendarTab events={events} editionYear={editionYear} /> },
            { id: "como-e-a-prova", label: "Como é a prova", content: <StructureTab structure={structure} /> },
            { id: "documentos", label: "Documentos oficiais", content: <DocumentsTab edition={edition} /> },
          ]}
        />
      </section>
    </main>
  );
}
