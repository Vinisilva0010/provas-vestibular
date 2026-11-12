import type { Metadata } from "next";
import Link from "next/link";
import { Arrow } from "@/components/art/doodles";
import { Professor } from "@/components/professor/professor";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { getDataset } from "@/lib/data/get-dataset";

export const metadata: Metadata = {
  title: "Todas as provas",
  description: "Lista das provas de entrada na faculdade com datas, regras e documentos oficiais conferidos.",
};

const tones = ["bg-sun", "bg-coral", "bg-violet-soft", "bg-paper"];
const tilts = ["-rotate-1", "rotate-1", "rotate-0", "-rotate-2"];

export default async function ExamsPage() {
  const dataset = await getDataset();

  return (
    <main className="mx-auto max-w-7xl px-5 pt-10">
      <div className="flex flex-col-reverse gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="display-type text-[clamp(3rem,9vw,7rem)] leading-[0.88]">Todas as provas</h1>
          <p className="mt-4 max-w-2xl text-xl">
            Escolha uma prova para ver as datas, como ela funciona e os documentos oficiais.
          </p>
        </div>
        <Professor pose="point-right" size="lg" />
      </div>

      <ul className="mt-12 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
        {dataset.exams.map((exam, index) => (
          <li key={exam.slug}>
            <Link
              href={`/provas/${exam.slug}`}
              className={cn(
                "group flex h-full min-h-56 flex-col justify-between gap-5 rounded-2xl border-4 border-ink p-6 no-underline shadow-card",
                "transition-[transform,box-shadow,rotate] duration-200 ease-out hover:-translate-y-1.5 hover:rotate-0 hover:shadow-card-hover",
                tones[index % tones.length],
                tilts[index % tilts.length],
              )}
            >
              <span className="display-type text-6xl leading-[0.9]">{exam.shortName}</span>
              <span className="text-lg font-extrabold">{exam.summary}</span>
              <span className="flex items-end justify-between gap-4">
                {exam.hasStudyPlan ? <Badge tone="paper">Tem plano de estudo</Badge> : <span />}
                <Arrow className="w-14 shrink-0 transition-transform duration-200 group-hover:translate-x-1.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <p className="mt-12 text-lg">
        As outras provas entram nesta lista conforme os dados oficiais forem conferidos.
      </p>
    </main>
  );
}
