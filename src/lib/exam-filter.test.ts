import { describe, expect, it } from "vitest";
import { filterExams, normalizeSearch, stateOptions, type ExamCard } from "./exam-filter";

const card = (slug: string, states: ExamCard["states"], hasStudyPlan: boolean, summary = ""): ExamCard => ({
  slug,
  shortName: slug.toUpperCase(),
  officialName: `Vestibular ${slug}`,
  summary,
  states,
  hasStudyPlan,
});

const exams = [
  card("enem", ["BR"], true, "Prova nacional"),
  card("fuvest", ["SP"], true, "Vestibular da USP"),
  card("ufpr", ["PR"], true, "Universidade Federal do Paraná"),
  card("ufg", ["GO"], false, "Universidade Federal de Goiás"),
];

const slugs = (list: ExamCard[]) => list.map((exam) => exam.slug);

describe("normalizeSearch", () => {
  it("ignores accents, case and surrounding spaces", () => {
    expect(normalizeSearch("  Paraná ")).toBe("parana");
    expect(normalizeSearch("GOIÁS")).toBe("goias");
  });
});

describe("filterExams", () => {
  it("returns everything with no filter", () => {
    expect(slugs(filterExams(exams, {}))).toEqual(["enem", "fuvest", "ufpr", "ufg"]);
  });

  it("searches names and summary without caring about accents", () => {
    expect(slugs(filterExams(exams, { query: "parana" }))).toEqual(["ufpr"]);
    expect(slugs(filterExams(exams, { query: "Goiás" }))).toEqual(["ufg"]);
    expect(slugs(filterExams(exams, { query: "fuv" }))).toEqual(["fuvest"]);
    expect(slugs(filterExams(exams, { query: "nada disso" }))).toEqual([]);
  });

  it("filters by state and always keeps nationwide exams", () => {
    expect(slugs(filterExams(exams, { state: "SP" }))).toEqual(["enem", "fuvest"]);
  });

  it("can keep only exams with a study plan", () => {
    expect(slugs(filterExams(exams, { studyPlanOnly: true }))).toEqual(["enem", "fuvest", "ufpr"]);
  });

  it("combines every filter", () => {
    expect(slugs(filterExams(exams, { query: "usp", state: "SP", studyPlanOnly: true }))).toEqual(["fuvest"]);
  });
});

describe("stateOptions", () => {
  it("lists the states of the exams once, without the nationwide code", () => {
    expect(stateOptions(exams)).toEqual(["GO", "PR", "SP"]);
  });
});
