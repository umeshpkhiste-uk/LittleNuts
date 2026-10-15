/**
 * Weight handling, in integer grams — the canonical unit throughout the
 * database and this app (spec section 8: "Use integer grams as the
 * canonical weight unit... 1 kg equals 1,000 grams").
 */

export const WEIGHT_PRESETS_G = [100, 250, 500, 750, 1000] as const;

export function formatWeight(grams: number): string {
  if (grams >= 1000 && grams % 1000 === 0) {
    const kg = grams / 1000;
    return `${kg} kg`;
  }
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(2)} kg`;
  }
  return `${grams} g`;
}

export function clampToIncrement(grams: number, incrementG: number): number {
  if (incrementG <= 0) return grams;
  return Math.round(grams / incrementG) * incrementG;
}

export function isValidQuantity(
  grams: number,
  minG: number,
  maxG: number | null,
  incrementG: number,
): boolean {
  if (grams < minG) return false;
  if (maxG !== null && grams > maxG) return false;
  if ((grams - minG) % incrementG !== 0) return false;
  return true;
}
