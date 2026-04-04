/**
 * Type guard for the project's custom HttpError shape.
 * Checks for `status` and `payload` fields.
 */
export function isHttpError(err: unknown): err is { status: number; payload: { message: string; error_code?: string } } {
  return typeof err === 'object' && err !== null && 'status' in err && 'payload' in err;
}

/** Extracts an error code or user-facing message from a HttpError, with a fallback. */
export function getErrorMessage(err: unknown, fallback = 'registerFailed'): string {
  if (isHttpError(err)) {
    return err.payload?.error_code || err.payload?.message || fallback;
  }
  return fallback;
}
