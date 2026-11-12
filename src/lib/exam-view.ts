import type { Dataset } from "./data/dataset";
import type { Edition, Exam, ExamEvent, ExamStructure } from "./data/schemas";
import { toEpochDay } from "./dates/iso-date";
import { formatDuration } from "./format";

/** A dated item that can be shown with a countdown. Safe to send to the browser. */
export type DateItem = { id: string; label: string; startDate: string; endDate?: string };
export type UpcomingDate = DateItem & { countdown: string };

export type ExamView = {
  exam: Exam;
  editionYear?: number;
  edition?: Edition;
  structure?: ExamStructure;
  events: ExamEvent[];
  dateItems: DateItem[];
};

/** Dated events first, by start date; undated ones last; ties broken by id. */
export function compareEvents(a: ExamEvent, b: ExamEvent): number {
  if (a.startDate === b.startDate) return a.id.localeCompare(b.id);
  if (a.startDate === undefined) return 1;
  if (b.startDate === undefined) return -1;
  return a.startDate.localeCompare(b.startDate);
}

/** Everything the exam page needs, for the most recent edition of the exam. */
export function buildExamView(dataset: Dataset, slug: string): ExamView | null {
  const exam = dataset.exams.find((candidate) => candidate.slug === slug);
  if (!exam) return null;

  const years = [...dataset.editions, ...dataset.structures, ...dataset.events]
    .filter((document) => document.examSlug === slug)
    .map((document) => document.editionYear);
  const editionYear = years.length > 0 ? Math.max(...years) : undefined;

  const ofEdition = <T extends { examSlug: string; editionYear: number }>(document: T) =>
    document.examSlug === slug && document.editionYear === editionYear;

  const events = dataset.events.filter(ofEdition).sort(compareEvents);
  const dateItems: DateItem[] = events.flatMap((event) =>
    event.startDate
      ? [{ id: event.id, label: event.label, startDate: event.startDate, ...(event.endDate ? { endDate: event.endDate } : {}) }]
      : [],
  );

  return {
    exam,
    editionYear,
    edition: dataset.editions.find(ofEdition),
    structure: dataset.structures.find(ofEdition),
    events,
    dateItems,
  };
}

/** Dates that have not ended yet, with a countdown in plain Portuguese. */
export function upcomingDates(items: DateItem[], todayIsoDate: string): UpcomingDate[] {
  const today = toEpochDay(todayIsoDate);
  return items
    .flatMap((item) => {
      const startsIn = toEpochDay(item.startDate) - today;
      const endsIn = toEpochDay(item.endDate ?? item.startDate) - today;
      if (endsIn < 0) return [];
      let countdown: string;
      if (startsIn < 0) countdown = "Acontecendo agora";
      else if (startsIn === 0) countdown = endsIn === 0 ? "É hoje" : "Começa hoje";
      else if (startsIn === 1) countdown = "Amanhã";
      else countdown = `Faltam ${startsIn} dias`;
      return [{ ...item, countdown }];
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id));
}

type PhaseNumbers = Partial<
  Pick<ExamStructure["phases"][number], "days" | "durationMinutesPerDay" | "questionCount" | "maxScore">
>;

/** Short facts about a phase: "2 dias", "até 4 horas por dia", "80 questões", "100 pontos". */
export function phaseFacts(phase: PhaseNumbers): string[] {
  const facts: string[] = [];
  if (phase.days) facts.push(phase.days === 1 ? "1 dia" : `${phase.days} dias`);
  if (phase.durationMinutesPerDay) {
    const perDay = phase.days && phase.days > 1 ? " por dia" : "";
    facts.push(`até ${formatDuration(phase.durationMinutesPerDay)}${perDay}`);
  }
  if (phase.questionCount) facts.push(`${phase.questionCount} questões`);
  if (phase.maxScore) facts.push(`${phase.maxScore} pontos`);
  return facts;
}
