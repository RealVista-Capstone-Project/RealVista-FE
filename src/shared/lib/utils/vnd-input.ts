/** Strip to digits only (for VND amount entry). */
export function sanitizeVndDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** Group digits for display (vi-VN). Empty input stays empty. */
export function formatVndDigitsForDisplay(digits: string): string {
  if (!digits) return '';
  const n = Number(digits);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('vi-VN');
}

/** Parse digit string to integer VND (0 if empty). Clamped to safe integer range. */
export function digitsToVndInteger(digits: string): number {
  if (!digits) return 0;
  const n = Number(digits);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.trunc(n), Number.MAX_SAFE_INTEGER);
}

export function vndIntegerToDigitString(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '';
  return String(Math.min(Math.trunc(value), Number.MAX_SAFE_INTEGER));
}
