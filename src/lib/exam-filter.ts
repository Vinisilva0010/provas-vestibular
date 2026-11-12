import type { Exam } from "./data/schemas";

/** What the exam list needs about each exam. Plain data, safe to send to the browser. */
export type ExamCard = Pick<Exam, "slug" | "shortName" | "officialName" | "summary" | "states" | "hasStudyPlan">;

export type ExamFilters = { query?: string; state?: string; studyPlanOnly?: boolean };

/** Lowercase, no accents, no surrounding spaces: "Paraná" -> "parana". */
export function normalizeSearch(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

export function filterExams(exams: ExamCard[], { query = "", state = "", studyPlanOnly = false }: ExamFilters): ExamCard[] {
  const search = normalizeSearch(query);
  return exams.filter((exam) => {
    if (studyPlanOnly && !exam.hasStudyPlan) return false;
    if (state && !exam.states.some((code) => code === state || code === "BR")) return false;
    if (search) {
      const haystack = normalizeSearch(`${exam.shortName} ${exam.officialName} ${exam.summary}`);
      if (!haystack.includes(search)) return false;
    }
    return true;
  });
}

/** States that appear in the list, once each, without the nationwide code. */
export function stateOptions(exams: ExamCard[]): ExamCard["states"] {
  const codes = new Set(exams.flatMap((exam) => exam.states).filter((code) => code !== "BR"));
  return [...codes].sort();
}
