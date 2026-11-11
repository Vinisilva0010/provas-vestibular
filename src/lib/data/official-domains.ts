/**
 * Domains accepted as official sources. A URL matches when its host is the
 * domain itself or a subdomain of it. Add a domain here only after checking
 * that it belongs to the institution.
 */
export const officialDomains: readonly string[] = [
  // Federal government: Inep (ENEM), SiSU, ProUni, FIES, state agencies
  "gov.br",
  // Featured exams
  "fuvest.br",
  "usp.br",
  "unicamp.br",
  "vunesp.com.br",
  "unesp.br",
  "uerj.br",
  "ita.br",
  "eb.mil.br",
  "ufrgs.br",
  "ufpr.br",
  // Other federal universities
  "ufmg.br",
  "ufrj.br",
  "ufsc.br",
  "ufpe.br",
  "ufba.br",
  "ufg.br",
  "ufes.br",
  "ufscar.br",
  // Military schools
  "fab.mil.br",
  "marinha.mil.br",
  // Private institutions
  "mackenzie.br",
  "pucsp.br",
  "puc-rio.br",
  "pucrs.br",
  "pucpr.br",
  "pucminas.br",
  "puc-campinas.edu.br",
  "fgv.br",
  "insper.edu.br",
  "espm.br",
  // Fatec (Centro Paula Souza)
  "vestibularfatec.com.br",
];

/** True for https URLs on an official domain, with no credentials and no custom port. */
export function isOfficialUrl(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }

  if (url.protocol !== "https:" || url.username !== "" || url.password !== "" || url.port !== "") {
    return false;
  }

  const host = url.hostname.toLowerCase();
  return officialDomains.some((domain) => host === domain || host.endsWith(`.${domain}`));
}
