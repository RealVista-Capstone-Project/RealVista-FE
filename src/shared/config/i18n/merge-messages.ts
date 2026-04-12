/**
 * Deep-merge translation objects: `primary` wins on leaf values; nested objects are merged.
 * Used so locale files can omit new nested keys and still inherit from English fallback.
 */
function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function mergeRecordDeep(
  fallback: Record<string, unknown>,
  primary: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...fallback };
  for (const key of Object.keys(primary)) {
    const p = primary[key];
    const existing = out[key];
    if (isPlainObject(p) && isPlainObject(existing)) {
      out[key] = mergeRecordDeep(existing, p);
    } else {
      out[key] = p;
    }
  }
  return out;
}
