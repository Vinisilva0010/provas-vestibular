/** Minimum contrast for body text (WCAG 2.2, level AA). */
export const WCAG_AA_TEXT = 4.5;

/** Minimum contrast for borders, icons and focus indicators (WCAG 2.2, level AA). */
export const WCAG_AA_NON_TEXT = 3;

const HEX_COLOR = /^#([0-9a-f]{6})$/i;

function linearChannel(value: number): number {
  const srgb = value / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance as defined by WCAG, from 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const digits = HEX_COLOR.exec(hex)?.[1];
  if (digits === undefined) {
    throw new RangeError(`Invalid color "${hex}". Expected a 6-digit hex value like #1a2b3c.`);
  }

  const value = Number.parseInt(digits, 16);
  const red = (value >> 16) & 0xff;
  const green = (value >> 8) & 0xff;
  const blue = value & 0xff;

  return 0.2126 * linearChannel(red) + 0.7152 * linearChannel(green) + 0.0722 * linearChannel(blue);
}

/** WCAG contrast ratio between two colors, from 1 to 21. Order does not matter. */
export function contrastRatio(first: string, second: string): number {
  const a = relativeLuminance(first);
  const b = relativeLuminance(second);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}
