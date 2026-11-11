/**
 * Single source of truth for the palette.
 * src/app/globals.css must declare the same values; tokens.test.ts enforces it.
 */
export const palette = {
  coral: "#fc6a60",
  coralSoft: "#fff1ef",
  sun: "#fac70f",
  sunSoft: "#fff8dc",
  violet: "#5834f8",
  violetSoft: "#f1edff",
  ink: "#111111",
  paper: "#ffffff",
} as const;

export type PaletteColor = keyof typeof palette;

export const cssVariableName: Record<PaletteColor, string> = {
  coral: "--color-coral",
  coralSoft: "--color-coral-soft",
  sun: "--color-sun",
  sunSoft: "--color-sun-soft",
  violet: "--color-violet",
  violetSoft: "--color-violet-soft",
  ink: "--color-ink",
  paper: "--color-paper",
};

/**
 * Backgrounds allowed to carry text. Text is always ink.
 * Violet is excluded on purpose: ink on violet fails WCAG AA.
 */
export const textBackgrounds = [
  "paper",
  "coral",
  "coralSoft",
  "sun",
  "sunSoft",
  "violetSoft",
] as const satisfies readonly PaletteColor[];

/** Colors allowed for borders, icons and focus rings on light backgrounds. */
export const uiStrokeColors = ["ink", "violet"] as const satisfies readonly PaletteColor[];
