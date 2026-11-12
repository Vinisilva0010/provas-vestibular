import type { Dataset } from "./data/dataset";
import type { ExamEvent } from "./data/schemas";
import { compareEvents } from "./exam-view";
import { MONTHS } from "./format";

/** One date on the calendar page. Plain data, safe to send to the browser. */
export type CalendarEntry = {
  id: string;
  examSlug: string;
  examName: string;
  label: string;
  status: ExamEvent["status"];
  startDate?: string;
  endDate?: string;
};

export type CalendarMonth = { key: string; label: string; entries: CalendarEntry[] };

export type Calendar = {
  months: CalendarMonth[];
  undated: CalendarEntry[];
  exams: { slug: string; name: string }[];
};

/** "Março de 2026" from "2026-03". */
export function monthLabel(key: string): string {
  const [year, month] = key.split("-").map(Number) as [number, number];
  const name = MONTHS[month - 1] as string;
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} de ${year}`;
}

/** True when the last day of the entry is before today. Undated entries are never past. */
export function isPast(entry: { startDate?: string; endDate?: string }, todayIsoDate: string): boolean {
  const lastDay = entry.endDate ?? entry.startDate;
  return lastDay !== undefined && lastDay < todayIsoDate;
}

/** Every event of every exam, grouped by month, plus the ones without a date. */
export function buildCalendar(dataset: Dataset): Calendar {
  const names = new Map(dataset.exams.map((exam) => [exam.slug, exam.shortName]));

  const entries: CalendarEntry[] = [...dataset.events].sort(compareEvents).map((event) => ({
    id: event.id,
    examSlug: event.examSlug,
    examName: names.get(event.examSlug) ?? event.examSlug,
    label: event.label,
    status: event.status,
    ...(event.startDate ? { startDate: event.startDate } : {}),
    ...(event.endDate ? { endDate: event.endDate } : {}),
  }));

  const months: CalendarMonth[] = [];
  for (const entry of entries) {
    if (!entry.startDate) continue;
    const key = entry.startDate.slice(0, 7);
    let month = months.at(-1);
    if (month?.key !== key) {
      month = { key, label: monthLabel(key), entries: [] };
      months.push(month);
    }
    month.entries.push(entry);
  }

  return {
    months,
    undated: entries.filter((entry) => !entry.startDate),
    exams: dataset.exams
      .map((exam) => ({ slug: exam.slug, name: exam.shortName }))
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
  };
}
