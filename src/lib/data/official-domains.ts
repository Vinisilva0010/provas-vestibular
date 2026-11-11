import domainsFile from "../../../config/official-domains.json";

/** Shared with the Rust data tool. Edit config/official-domains.json, not this file. */
export const officialDomains: readonly string[] = domainsFile.domains;

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
