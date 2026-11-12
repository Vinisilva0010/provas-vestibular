"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Arrow } from "@/components/art/doodles";
import { Professor } from "@/components/professor/professor";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { filterExams, stateOptions, type ExamCard } from "@/lib/exam-filter";
import { regionLabel } from "@/lib/labels";

const tones = ["bg-sun", "bg-coral", "bg-violet-soft", "bg-paper"];
const tilts = ["-rotate-1", "rotate-1", "rotate-0", "-rotate-2"];
const fieldClass = "w-full rounded-xl border-3 border-ink bg-paper px-4 py-3 text-lg font-extrabold";

export function ExamFinder({ exams }: { exams: ExamCard[] }) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const [studyPlanOnly, setStudyPlanOnly] = useState(false);
  const ids = { search: useId(), state: useId(), plan: useId() };

  const results = filterExams(exams, { query, state, studyPlanOnly });
  const states = stateOptions(exams);

  return (
    <div>
      <div className="grid gap-5 rounded-2xl border-4 border-ink bg-paper p-5 shadow-card md:grid-cols-[1.5fr_1fr_auto] md:items-end">
        <div>
          <label htmlFor={ids.search} className="text-lg font-extrabold">
            Buscar prova
          </label>
          <input
            id={ids.search}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ex.: Fuvest, Unicamp, Paraná"
            className={cn(fieldClass, "mt-2")}
          />
        </div>
        <div>
          <label htmlFor={ids.state} className="text-lg font-extrabold">
            Estado
          </label>
          <select
            id={ids.state}
            value={state}
            onChange={(event) => setState(event.target.value)}
            className={cn(fieldClass, "mt-2")}
          >
            <option value="">Todos os estados</option>
            {states.map((code) => (
              <option key={code} value={code}>
                {regionLabel(code)}
              </option>
            ))}
          </select>
        </div>
        <label htmlFor={ids.plan} className="flex cursor-pointer items-center gap-3 text-lg font-extrabold md:pb-3">
          <input
            id={ids.plan}
            type="checkbox"
            checked={studyPlanOnly}
            onChange={(event) => setStudyPlanOnly(event.target.checked)}
            className="size-6 accent-violet"
          />
          Só provas com plano de estudo
        </label>
      </div>

      <p aria-live="polite" className="mt-6 text-xl font-extrabold">
        {results.length === 1 ? "1 prova encontrada" : `${results.length} provas encontradas`}
      </p>

      {results.length === 0 ? (
        <div className="mt-8 flex flex-col items-center gap-6 sm:flex-row">
          <Professor pose="thinking" size="lg" />
          <p className="text-2xl font-extrabold">Nenhuma prova encontrada com esses filtros.</p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((exam, index) => (
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
      )}
    </div>
  );
}
