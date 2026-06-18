/**
 * Masks a promo code so logged-out visitors see a teaser without the full value.
 * Keeps the first 3 and last 2 characters visible, e.g. "PETSITTER20" -> "PET••••••20".
 */
export function maskDiscountCode(code: string): string {
  const trimmed = code.trim();
  if (trimmed.length <= 5) {
    return `${trimmed.slice(0, 1)}${"•".repeat(Math.max(trimmed.length - 1, 2))}`;
  }
  const head = trimmed.slice(0, 3);
  const tail = trimmed.slice(-2);
  const hidden = "•".repeat(Math.max(trimmed.length - 5, 3));
  return `${head}${hidden}${tail}`;
}
