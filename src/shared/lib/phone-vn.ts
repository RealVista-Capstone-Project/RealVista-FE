const SEP_REGEX = /[\s\-.()/]/g;

/** National subscriber length after country code +84 or after stripping domestic trunk 0 */
const MIN_SUB_AFTER_84 = 8;
const MAX_SUB_AFTER_84 = 11;
const MIN_SUB_AFTER_0 = 9;
const MAX_SUB_AFTER_0 = 11;

/** User entered 9 digits without 0 prefix (national mobile prefixes) */
const MOBILE_NATIONAL_REGEX = /^[35789]\d{8}$/;

/**
 * Collapse common Vietnamese user input (+84 / 84 / 0…) into E.164 for Firebase Phone Auth.
 * Firebase still validates carrier-level rules; this only fixes format.
 */
export function normalizeVietnamesePhoneForE164(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const collapsed = trimmed.replace(SEP_REGEX, '');
  const digits = collapsed.replace(/\D/g, '');
  if (!digits.length) return null;

  if (digits.startsWith('84')) {
    let sub = digits.slice(2);
    if (sub.startsWith('0')) sub = sub.slice(1);
    if (sub.length >= MIN_SUB_AFTER_84 && sub.length <= MAX_SUB_AFTER_84 && !sub.startsWith('0')) {
      return `+84${sub}`;
    }
  }

  const subAfter0 = (): string => digits.slice(1);
  if (digits.startsWith('0')) {
    const sub = subAfter0();
    // Reject ambiguous double-prefix like 084xxxxxxxxxx (often a mistaken extra 84)
    if (
      sub.length >= MIN_SUB_AFTER_0 &&
      sub.length <= MAX_SUB_AFTER_0 &&
      !sub.startsWith('84')
    ) {
      return `+84${sub}`;
    }
    return null;
  }

  if (digits.length === 9 && MOBILE_NATIONAL_REGEX.test(digits)) {
    return `+84${digits}`;
  }

  return null;
}
