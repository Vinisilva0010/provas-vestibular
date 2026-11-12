import { describe, expect, it } from "vitest";
import { officialDocumentKinds, phaseFormats, regionCodes } from "./data/schemas";
import {
  documentKindLabel,
  eventStatusLabel,
  examFormatLabel,
  phaseFormatLabel,
  regionLabel,
} from "./labels";

describe("labels", () => {
  it("names every state and the whole country", () => {
    expect(regionLabel("SP")).toBe("São Paulo");
    expect(regionLabel("BR")).toBe("Todo o Brasil");
    for (const code of regionCodes) {
      expect(regionLabel(code).trim().length).toBeGreaterThan(0);
    }
  });

  it("has a Portuguese label for every status, format and document kind", () => {
    expect(eventStatusLabel["not-announced"]).toBe("Ainda não divulgado");
    expect(examFormatLabel.mixed.length).toBeGreaterThan(0);
    for (const format of phaseFormats) {
      expect(phaseFormatLabel[format].length).toBeGreaterThan(0);
    }
    for (const kind of officialDocumentKinds) {
      expect(documentKindLabel[kind].length).toBeGreaterThan(0);
    }
  });
});
