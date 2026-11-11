import { describe, expect, it } from "vitest";
import { isOfficialUrl } from "./official-domains";

describe("isOfficialUrl", () => {
  it("accepts https links on allowlisted domains and their subdomains", () => {
    expect(isOfficialUrl("https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem")).toBe(true);
    expect(isOfficialUrl("https://www.fuvest.br/")).toBe(true);
    expect(isOfficialUrl("https://fuvest.br/edital.pdf")).toBe(true);
    expect(isOfficialUrl("https://www.comvest.unicamp.br/")).toBe(true);
  });

  it("rejects plain http", () => {
    expect(isOfficialUrl("http://www.fuvest.br/")).toBe(false);
  });

  it("rejects look-alike domains", () => {
    expect(isOfficialUrl("https://fuvest.br.site-falso.com/")).toBe(false);
    expect(isOfficialUrl("https://falsofuvest.br/")).toBe(false);
    expect(isOfficialUrl("https://gov.br.example.com/")).toBe(false);
  });

  it("rejects embedded credentials and custom ports", () => {
    expect(isOfficialUrl("https://user:pass@www.fuvest.br/")).toBe(false);
    expect(isOfficialUrl("https://www.fuvest.br:8443/")).toBe(false);
  });

  it("rejects strings that are not URLs", () => {
    expect(isOfficialUrl("fuvest.br")).toBe(false);
    expect(isOfficialUrl("")).toBe(false);
  });
});
