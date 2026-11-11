import { describe, expect, it } from "vitest";
import { coveredExamNames, featuredExams } from "./featured-exams";

describe("featuredExams", () => {
  it("has the seven exams with a study plan", () => {
    expect(featuredExams).toHaveLength(7);
  });

  it("uses unique, URL-safe slugs", () => {
    const slugs = featuredExams.map((exam) => exam.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it("gives every exam a summary", () => {
    for (const exam of featuredExams) {
      expect(exam.summary.trim().length).toBeGreaterThan(0);
    }
  });
});

describe("coveredExamNames", () => {
  it("has no duplicates", () => {
    expect(new Set(coveredExamNames).size).toBe(coveredExamNames.length);
  });
});
