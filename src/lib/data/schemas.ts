import { z } from "zod";
import { isIsoDate, toEpochDay } from "@/lib/dates/iso-date";
import { isSlug, tryBuildId } from "./ids";
import { isOfficialUrl } from "./official-domains";

const text = z.string().trim().min(1, "Must not be empty.");
const slug = z.string().refine(isSlug, "Use lowercase letters, digits and single hyphens.");
const isoDate = z.string().refine(isIsoDate, "Expected a real date in YYYY-MM-DD format.");
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected a time as HH:MM (24h).");
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
    editionYear: z.number().int().min(2000).max(2100),
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
