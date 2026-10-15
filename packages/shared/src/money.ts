/**
 * Monetary arithmetic for LittleNuts, in integer paise (1 rupee = 100 paise).
 * Never use floating-point rupees for authoritative totals (spec section 8).
 *
 * Rounding rule: item subtotal = round_half_up(price_per_kg_paise * quantity_g / 1000).
 * This is the single rounding point; downstream sums of already-rounded
 * integers never re-round. The backend (Postgres function / Edge Function)
 * must perform the same calculation — this module exists so client-side
 * estimates match the server exactly before the server recalculates and
 * has final authority (spec section 8: "Recalculate all authoritative
 * prices and totals on the trusted backend").
 */

export function paiseToRupeesLabel(paise: number): string {
  const rupees = paise / 100;
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function itemSubtotalPaise(pricePerKgPaise: number, quantityG: number): number {
  const exact = pricePerKgPaise * quantityG;
  return Math.round(exact / 1000);
}

export function sumPaise(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
