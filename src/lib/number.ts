/** Parses "3,5" as well as "3.5" (Italian keyboards use a comma). Empty text is NaN. */
export function parseNumber(text: string): number {
  const clean = text.trim().replace(',', '.')
  return clean === '' ? NaN : Number(clean)
}
