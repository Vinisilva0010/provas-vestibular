import { z } from "zod";
import { isIsoDate, toEpochDay } from "@/lib/dates/iso-date";
import { isSlug, tryBuildId } from "./ids";
import { isOfficialUrl } from "./official-domains";

const text = z.string().trim().min(1, "Must not be empty.");
const slug = z.string().refine(isSlug, "Use lowercase letters, digits and single hyphens.");
const isoDate = z.string().refine(isIsoDate, "Expected a real date in YYYY-MM-DD format.");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected a time as HH:MM (24h).");
const editionYear = z.number().int().min(2000).max(2100);
const officialUrl = z
  .string()
  .refine(isOfficialUrl, "URL must be https and on an allowlisted official domain.");

/** Where a piece of information came from, and whether it is official or our own analysis. */
const provenance = {
  sourceName: text,
  sourceUrl: officialUrl,
  checkedAt: isoDate,
  nature: z.enum(["official", "analysis"]),
};

/** Brazilian state codes, plus BR for nationwide exams. */
export const regionCodes = [
  "BR",
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
  "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
  "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

function yearScopedIdCheck(type: "edition" | "structure") {
  return (
    document: { id: string; examSlug: string; editionYear: number },
    ctx: z.RefinementCtx,
  ) => {
    const expected = tryBuildId(type, document.examSlug, String(document.editionYear));
    if (document.id !== expected) {
      ctx.addIssue({
        code: "custom",
        path: ["id"],
        message: `id must be pvb-${type}-<examSlug>-<editionYear>.`,
      });
    }
  };
}

export const examSchema = z
  .strictObject({
    id: z.string(),
    type: z.literal("exam"),
    slug,
    officialName: text,
    shortName: text,
    institution: text,
    examFormat: z.enum(["objective", "essay", "mixed"]),
    hasStudyPlan: z.boolean(),
    states: z.array(z.enum(regionCodes)).min(1),
    audience: text,
    summary: text,
    officialSiteUrl: officialUrl,
    ...provenance,
  })
  .superRefine((exam, ctx) => {
    if (exam.id !== tryBuildId("exam", exam.slug)) {
      ctx.addIssue({ code: "custom", path: ["id"], message: "id must be pvb-exam-<slug>." });
    }
  });

export type Exam = z.infer<typeof examSchema>;

export const eventCategories = [
  "registration",
  "fee-exemption-request",
  "fee-exemption-result",
  "fee-payment",
  "exam-location",
  "exam-day",
  "specific-skills-test",
  "answer-key",
  "result",
  "enrollment",
  "waitlist",
] as const;

export const eventSchema = z
  .strictObject({
    id: z.string(),
    type: z.literal("event"),
    examSlug: slug,
    editionYear,
    key: slug,
    category: z.enum(eventCategories),
    /** Portuguese text shown on the site, e.g. "1ª fase". */
    label: text,
    status: z.enum(["official", "announced", "not-announced"]),
    startDate: isoDate.optional(),
    endDate: isoDate.optional(),
    gatesOpen: time.optional(),
    gatesClose: time.optional(),
    durationMinutes: z.number().int().positive().max(24 * 60).optional(),
    ...provenance,
  })
  .superRefine((event, ctx) => {
    const expectedId = tryBuildId("event", event.examSlug, String(event.editionYear), event.key);
    if (event.id !== expectedId) {
      ctx.addIssue({
        code: "custom",
        path: ["id"],
        message: "id must be pvb-event-<examSlug>-<editionYear>-<key>.",
      });
    }

    const hasDates = event.startDate !== undefined || event.endDate !== undefined;
    if (event.status === "not-announced" && hasDates) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "An event that was not announced cannot have dates.",
      });
    }
    if (event.status !== "not-announced" && event.startDate === undefined) {
      ctx.addIssue({
        code: "custom",
        path: ["startDate"],
        message: "An official or announced event needs a start date.",
      });
    }

    if (
      event.startDate !== undefined &&
      event.endDate !== undefined &&
      isIsoDate(event.startDate) &&
      isIsoDate(event.endDate) &&
      toEpochDay(event.endDate) < toEpochDay(event.startDate)
    ) {
      ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date is before start date." });
    }

    if (
      event.gatesOpen !== undefined &&
      event.gatesClose !== undefined &&
      event.gatesClose <= event.gatesOpen
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["gatesClose"],
        message: "Gates must close after they open.",
      });
    }
  });

export type ExamEvent = z.infer<typeof eventSchema>;

export const officialDocumentKinds = [
  "notice",
  "notice-amendment",
  "guide",
  "syllabus",
  "exemption-rules",
  "careers",
  "accessibility",
  "answer-key",
  "other",
] as const;

/** One year of an exam: how it works, places, fee and the official documents of that year. */
export const editionSchema = z
  .strictObject({
    id: z.string(),
    type: z.literal("edition"),
    examSlug: slug,
    editionYear,
    /** Short plain-language summary of the whole process. */
    howItWorks: text,
    vacanciesApprox: z.number().int().min(1).max(1_000_000).optional(),
    vacanciesNote: text.optional(),
    /** Registration fee in cents (R$ 228,00 = 22800), so no fractional numbers are stored. */
    feeCents: z.number().int().min(0).max(1_000_000).optional(),
    feeNote: text.optional(),
    documents: z
      .array(
        z.strictObject({
          label: text,
          url: officialUrl,
          kind: z.enum(officialDocumentKinds),
          publishedOn: isoDate.optional(),
        }),
      )
      .optional(),
    ...provenance,
  })
  .superRefine(yearScopedIdCheck("edition"));

export type Edition = z.infer<typeof editionSchema>;

export const phaseFormats = ["objective", "essay", "mixed", "skills"] as const;

const phaseSchema = z.strictObject({
  key: slug,
  label: text,
  format: z.enum(phaseFormats),
  days: z.number().int().min(1).max(10).optional(),
  durationMinutesPerDay: z.number().int().min(1).max(24 * 60).optional(),
  questionCount: z.number().int().min(1).max(1000).optional(),
  maxScore: z.number().int().min(1).max(10_000).optional(),
  subjects: z.array(text).min(1),
  notes: z.array(text).optional(),
});

/** How one year of an exam is built: phases, scoring, elimination rules and quotas. */
export const structureSchema = z
  .strictObject({
    id: z.string(),
    type: z.literal("structure"),
    examSlug: slug,
    editionYear,
    phases: z.array(phaseSchema).min(1),
    scoring: z.array(text).min(1),
    eliminationRules: z.array(text).optional(),
    quotas: z.array(z.strictObject({ key: slug, label: text, description: text })).optional(),
    tieBreak: text.optional(),
    accessibility: z.array(text).optional(),
    ...provenance,
  })
  .superRefine((structure, ctx) => {
    yearScopedIdCheck("structure")(structure, ctx);
    const keys = structure.phases.map((phase) => phase.key);
    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({ code: "custom", path: ["phases"], message: "Phase keys must be unique." });
    }
  });

export type ExamStructure = z.infer<typeof structureSchema>;
