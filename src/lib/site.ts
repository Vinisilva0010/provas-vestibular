/** Working name. Shown in the header, footer and browser tab. */
export const siteName = "Provas para entrar na faculdade";

export type NavItem = { href: string; label: string };

export const mainNavigation: NavItem[] = [
  { href: "/provas", label: "Provas" },
  { href: "/calendario", label: "Calendário" },
  { href: "/comparar", label: "Comparar" },
  { href: "/calculadora", label: "Calculadora" },
];
