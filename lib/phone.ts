/** Normalize Moroccan mobile numbers without accepting letters or other countries. */
export function normalizeMoroccanPhone(input: unknown): string | null {
  if (typeof input !== 'string' || input.length > 40) return null;
  const value = input.trim();
  if (!/^\+?[\d\s().-]+$/.test(value)) return null;
  let digits = value.replace(/[\s().-]/g, '');
  if (digits.startsWith('+')) {
    if (!digits.startsWith('+212')) return null;
    digits = digits.slice(1);
  }
  else if (digits.startsWith('00')) {
    if (!digits.startsWith('00212')) return null;
    digits = digits.slice(2);
  }
  if (/^0[67]\d{8}$/.test(digits)) digits = `212${digits.slice(1)}`;
  return /^212[67]\d{8}$/.test(digits) ? digits : null;
}
