"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import { isPast, type Calendar, type CalendarEntry } from "@/lib/calendar";
import { cn } from "@/lib/cn";
import { todayInExamTimeZone } from "@/lib/dates/days-until";
import { formatDateRange } from "@/lib/format";
import { eventStatusLabel } from "@/lib/labels";

const subscribe = () => () => {};
const monthTones = ["bg-sun", "bg-coral", "bg-violet-soft"];

function FilterButton({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={cn(
        "rounded-xl border-3 border-ink px-4 py-2 text-lg font-extrabold transition-[transform,box-shadow] duration-150",
        pressed ? "bg-sun shadow-card" : "bg-paper hover:-translate-y-0.5 hover:shadow-card",
      )}
    >
      {children}
    </button>
  );
}

function Entry({ entry, past }: { entry: CalendarEntry; past: boolean }) {
  return (
    <li
      className={cn(
        "flex flex-col gap-3 rounded-2xl border-3 border-ink bg-paper p-4 sm:flex-row sm:items-center sm:justify-between",
        past && "border-dashed",
      )}
    >
      <div>
        <p className="text-lg font-extrabold">
          {entry.startDate ? formatDateRange(entry.startDate, entry.endDate) : "Data ainda não divulgada"}
        </p>
        <p className="text-xl">{entry.label}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {past && <Badge tone="paper">Já passou</Badge>}
        {entry.status !== "official" && <Badge tone="violet">{eventStatusLabel[entry.status]}</Badge>}
        <Link
          href={`/provas/${entry.examSlug}`}
          className="rounded-lg border-2 border-ink bg-sun px-3 py-1 text-base font-extrabold no-underline hover:-translate-y-0.5"
        >
          {entry.examName}
        </Link>
      </div>
    </li>
  );
}

/**
 * Interactive part of the calendar: filter by exam and hide past dates.
 * "Today" is computed in the browser with Brasília time, so the page can be
 * built in advance and still be right every day.
 */
export function CalendarBoard({ calendar }: { calendar: Calendar }) {
  const today = useSyncExternalStore(subscribe, () => todayInExamTimeZone(), () => null);
  const [exam, setExam] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  const pastIn = (entry: CalendarEntry) => today !== null && isPast(entry, today);
  const ofExam = (entry: CalendarEntry) => exam === null || entry.examSlug === exam;

  const isHidden = (entry: CalendarEntry) => !showPast && pastIn(entry);
  const hiddenPast = calendar.months
    .flatMap((month) => month.entries)
    .filter((entry) => ofExam(entry) && isHidden(entry)).length;
  const months = calendar.months
    .map((month) => ({
      ...month,
      entries: month.entries.filter((entry) => ofExam(entry) && !isHidden(entry)),
    }))
    .filter((month) => month.entries.length > 0);
  const undated = calendar.undated.filter(ofExam);

  return (
    <div>
      <div role="group" aria-label="Filtrar por prova" className="flex flex-wrap gap-3">
        <FilterButton pressed={exam === null} onClick={() => setExam(null)}>
          Todas
        </FilterButton>
        {calendar.exams.map((item) => (
          <FilterButton key={item.slug} pressed={exam === item.slug} onClick={() => setExam(item.slug)}>
            {item.name}
          </FilterButton>
        ))}
      </div>

      {(hiddenPast > 0 || showPast) && (
        <button
          type="button"
          onClick={() => setShowPast((value) => !value)}
          className="mt-5 text-lg font-extrabold underline decoration-violet decoration-3 underline-offset-4"
        >
          {showPast
            ? "Esconder as datas que já passaram"
            : hiddenPast === 1
              ? "Mostrar 1 data que já passou"
              : `Mostrar ${hiddenPast} datas que já passaram`}
        </button>
      )}

      {months.length === 0 && undated.length === 0 && (
        <p className="mt-10 text-xl font-extrabold">Nenhuma data para mostrar com este filtro.</p>
      )}

      <div className="mt-10 space-y-12">
        {months.map((month, index) => (
          <section key={month.key} className="grid gap-5 lg:grid-cols-[16rem_1fr]">
            <h2
              className={cn(
                "display-type self-start rounded-2xl border-4 border-ink p-4 text-4xl leading-none shadow-card lg:sticky lg:top-28",
                monthTones[index % monthTones.length],
              )}
            >
              {month.label}
            </h2>
            <ol className="space-y-4">
              {month.entries.map((entry) => (
                <Entry key={entry.id} entry={entry} past={pastIn(entry)} />
              ))}
            </ol>
          </section>
        ))}

        {undated.length > 0 && (
          <section className="grid gap-5 lg:grid-cols-[16rem_1fr]">
            <h2 className="display-type self-start rounded-2xl border-4 border-dashed border-ink bg-paper p-4 text-4xl leading-none">
              Ainda sem data
            </h2>
            <ol className="space-y-4">
              {undated.map((entry) => (
                <Entry key={entry.id} entry={entry} past={false} />
              ))}
            </ol>
          </section>
        )}
      </div>
    </div>
  );
}
