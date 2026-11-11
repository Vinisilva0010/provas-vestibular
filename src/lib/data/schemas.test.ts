import { describe, expect, it } from "vitest";
import { eventSchema, examSchema } from "./schemas";

const provenance = {
  sourceName: "Fuvest — site oficial",
  sourceUrl: "https://www.fuvest.br/",
  checkedAt: "2026-11-11",
  nature: "official",
} as const;

const validExam = {
  id: "pvb-exam-fuvest",
  type: "exam",
  slug: "fuvest",
  officialName: "Vestibular Fuvest",
  shortName: "Fuvest",
  institution: "Universidade de São Paulo (USP)",
  examFormat: "mixed",
  hasStudyPlan: true,
  states: ["SP"],
  audience: "Quem terminou ou está terminando o ensino médio",
  summary: "Vestibular da USP, em duas fases.",
  officialSiteUrl: "https://www.fuvest.br/",
  ...provenance,
};

const validEvent = {
  id: "pvb-event-fuvest-2027-phase-1",
  type: "event",
  examSlug: "fuvest",
  editionYear: 2027,
  key: "phase-1",
  category: "exam-day",
  label: "1ª fase",
  status: "official",
  startDate: "2027-11-21",
  endDate: "2027-11-21",
  gatesOpen: "12:00",
  gatesClose: "13:00",
  durationMinutes: 300,
  ...provenance,
};

function issuePaths(result: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) {
  return (result.error?.issues ?? []).map((issue) => issue.path.join("."));
}

describe("examSchema", () => {
  it("accepts a complete exam", () => {
    expect(examSchema.safeParse(validExam).success).toBe(true);
  });

  it("rejects an id that does not match the slug", () => {
    const result = examSchema.safeParse({ ...validExam, id: "pvb-exam-unicamp" });
    expect(result.success).toBe(false);
    expect(issuePaths(result)).toContain("id");
  });

  it("rejects an official site outside the allowlist", () => {
    const result = examSchema.safeParse({ ...validExam, officialSiteUrl: "https://fuvest.blog/" });
    expect(issuePaths(result)).toContain("officialSiteUrl");
  });

  it("rejects fields nobody defined", () => {
    const result = examSchema.safeParse({ ...validExam, price: 10 });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown state code", () => {
    const result = examSchema.safeParse({ ...validExam, states: ["XX"] });
    expect(issuePaths(result)).toContain("states.0");
  });

  it("rejects an empty name", () => {
    const result = examSchema.safeParse({ ...validExam, officialName: "   " });
    expect(issuePaths(result)).toContain("officialName");
  });

  it("rejects a slug that would break the id", () => {
    const result = examSchema.safeParse({ ...validExam, slug: "Fuvest" });
    expect(result.success).toBe(false);
  });
});

describe("eventSchema", () => {
  it("accepts a complete official event", () => {
    expect(eventSchema.safeParse(validEvent).success).toBe(true);
  });

  it("accepts an event that was not announced yet, without dates", () => {
    const { startDate: _s, endDate: _e, gatesOpen: _o, gatesClose: _c, durationMinutes: _d, ...rest } = validEvent;
    expect(eventSchema.safeParse({ ...rest, status: "not-announced" }).success).toBe(true);
  });

  it("rejects an event that was not announced but has a date", () => {
    const result = eventSchema.safeParse({ ...validEvent, status: "not-announced" });
    expect(issuePaths(result)).toContain("startDate");
  });

  it("rejects an official event without a start date", () => {
    const { startDate: _s, ...rest } = validEvent;
    const result = eventSchema.safeParse(rest);
    expect(issuePaths(result)).toContain("startDate");
  });

  it("rejects an end date before the start date", () => {
    const result = eventSchema.safeParse({ ...validEvent, endDate: "2027-11-20" });
    expect(issuePaths(result)).toContain("endDate");
  });

  it("rejects gates closing before they open", () => {
    const result = eventSchema.safeParse({ ...validEvent, gatesOpen: "13:00", gatesClose: "12:30" });
    expect(issuePaths(result)).toContain("gatesClose");
  });

  it("rejects impossible dates and times", () => {
    expect(issuePaths(eventSchema.safeParse({ ...validEvent, startDate: "2027-02-30" }))).toContain("startDate");
    expect(issuePaths(eventSchema.safeParse({ ...validEvent, gatesOpen: "24:00" }))).toContain("gatesOpen");
  });

  it("rejects an id that does not match exam, year and key", () => {
    const result = eventSchema.safeParse({ ...validEvent, id: "pvb-event-fuvest-2026-phase-1" });
    expect(issuePaths(result)).toContain("id");
  });

  it("rejects an unknown category", () => {
    const result = eventSchema.safeParse({ ...validEvent, category: "party" });
    expect(issuePaths(result)).toContain("category");
  });

  it("rejects analysis passed off with an unknown nature", () => {
    const result = eventSchema.safeParse({ ...validEvent, nature: "opinion" });
    expect(issuePaths(result)).toContain("nature");
  });
});
