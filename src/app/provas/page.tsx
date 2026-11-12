import type { Metadata } from "next";
import { ExamFinder } from "@/components/exams/exam-finder";
import { Professor } from "@/components/professor/professor";
import { getDataset } from "@/lib/data/get-dataset";
import type { ExamCard } from "@/lib/exam-filter";

export const metadata: Metadata = {
  title: "Todas as provas",
  description: "Lista das provas de entrada na faculdade com datas, regras e documentos oficiais conferidos.",
};

export default async function ExamsPage() {
  const dataset = await getDataset();
  const exams: ExamCard[] = dataset.exams
    .map(({ slug, shortName, officialName, summary, states, hasStudyPlan }) => ({
      slug,
      shortName,
      officialName,
      summary,
      states,
      hasStudyPlan,
    }))
    .sort((a, b) => a.shortName.localeCompare(b.shortName, "pt-BR"));

  return (
    <main className="mx-auto max-w-7xl px-5 pt-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="display-type text-[clamp(3rem,9vw,7rem)] leading-[0.88]">Todas as provas</h1>
          <p className="mt-4 max-w-2xl text-xl">
            Busque pelo nome ou filtre pelo seu estado. Cada prova tem as datas, como ela funciona e os documentos
            oficiais.
          </p>
        </div>
        <Professor pose="point-left" size="lg" className="self-center sm:self-end" />
      </div>

      <div className="mt-10">
        <ExamFinder exams={exams} />
      </div>

      <p className="mt-12 text-lg">
        As outras provas entram nesta lista conforme os dados oficiais forem conferidos.
      </p>
    </main>
  );
}
