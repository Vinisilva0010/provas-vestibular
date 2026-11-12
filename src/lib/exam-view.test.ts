import { describe, expect, it } from "vitest";
import type { Dataset } from "./data/dataset";
import type { ExamEvent } from "./data/schemas";
import { buildExamView, compareEvents, phaseFacts, upcomingDates } from "./exam-view";

const exam = { id: "pvb-exam-fuvest", type: "exam", slug: "fuvest", shortName: "Fuvest" };

function event(key: string, year: number, startDate?: string, endDate?: string): ExamEvent {
  return {
    id: `pvb-event-fuvest-${year}-${key}`,
    examSlug: "fuvest",
    editionYear: year,
    key,
    label: key,
    status: startDate ? "official" : "not-announced",
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  } as ExamEvent;
}

const dataset = {
  generatedAt: 1,
  exams: [exam],
  events: [
    event("old", 2026, "2025-11-01"),
    event("phase-2", 2027, "2026-12-06", "2026-12-07"),
    event("enrollment", 2027),
    event("phase-1", 2027, "2026-11-01"),
  ],
  editions: [
    { id: "pvb-edition-fuvest-2026", examSlug: "fuvest", editionYear: 2026 },
    { id: "pvb-edition-fuvest-2027", examSlug: "fuvest", editionYear: 2027 },
  ],
  structures: [{ id: "pvb-structure-fuvest-2027", examSlug: "fuvest", editionYear: 2027 }],
} as unknown as Dataset;

describe("buildExamView", () => {
  it("returns null for an unknown exam", () => {
    expect(buildExamView(dataset, "unicamp")).toBeNull();
  });

  it("uses the latest edition and its events, dated ones first", () => {
    const view = buildExamView(dataset, "fuvest");
    expect(view?.editionYear).toBe(2027);
    expect(view?.edition?.id).toBe("pvb-edition-fuvest-2027");
    expect(view?.structure?.id).toBe("pvb-structure-fuvest-2027");
    expect(view?.events.map((e) => e.key)).toEqual(["phase-1", "phase-2", "enrollment"]);
    expect(view?.dateItems.map((item) => item.id)).toEqual([
      "pvb-event-fuvest-2027-phase-1",
      "pvb-event-fuvest-2027-phase-2",
    ]);
  });

  it("works for an exam without editions", () => {
    const view = buildExamView({ ...dataset, events: [], editions: [], structures: [] }, "fuvest");
    expect(view?.editionYear).toBeUndefined();
    expect(view?.events).toEqual([]);
  });
});

describe("compareEvents", () => {
  it("orders by start date, puts undated events last and breaks ties by id", () => {
    const a = event("a", 2027, "2026-11-01");
    const b = event("b", 2027, "2026-11-01");
    const undated = event("c", 2027);
    expect(compareEvents(a, b)).toBeLessThan(0);
    expect(compareEvents(undated, a)).toBeGreaterThan(0);
    expect(compareEvents(a, undated)).toBeLessThan(0);
    expect(compareEvents(undated, event("d", 2027))).toBeLessThan(0);
  });
});

describe("upcomingDates", () => {
  const items = [
    { id: "past", label: "Passou", startDate: "2026-11-01" },
    { id: "today", label: "Hoje", startDate: "2026-11-11" },
    { id: "starts-today", label: "Começa hoje", startDate: "2026-11-11", endDate: "2026-11-13" },
    { id: "ongoing", label: "Em andamento", startDate: "2026-11-09", endDate: "2026-11-12" },
    { id: "tomorrow", label: "Amanhã", startDate: "2026-11-12" },
    { id: "later", label: "Depois", startDate: "2026-11-23" },
  ];

  it("drops past dates and describes the rest", () => {
    const result = upcomingDates(items, "2026-11-11");
    expect(result.map((item) => [item.id, item.countdown])).toEqual([
      ["ongoing", "Acontecendo agora"],
      ["today", "É hoje"],
      ["starts-today", "Começa hoje"],
      ["tomorrow", "Amanhã"],
      ["later", "Faltam 12 dias"],
    ]);
  });
});

describe("phaseFacts", () => {
  it("lists days, duration, questions and score in plain words", () => {
    expect(
      phaseFacts({ days: 1, durationMinutesPerDay: 300, questionCount: 80, maxScore: 100 }),
    ).toEqual(["1 dia", "até 5 horas", "80 questões", "100 pontos"]);
    expect(phaseFacts({ days: 2, durationMinutesPerDay: 240 })).toEqual(["2 dias", "até 4 horas por dia"]);
    expect(phaseFacts({})).toEqual([]);
  });
});
