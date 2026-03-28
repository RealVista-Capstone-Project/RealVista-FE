/**
 * Type guard for Axios-shaped errors without importing axios directly.
 * Checks for the `response.data.message` shape returned by the backend API.
 */
export function isApiError(err: unknown): err is { response?: { data?: { message?: string } } } {
  return typeof err === 'object' && err !== null && 'response' in err;
}

/** Extracts a user-facing message from an API error, with a fallback. */
export function getErrorMessage(err: unknown, fallback = 'Đã xảy ra lỗi. Vui lòng thử lại.'): string {
  if (isApiError(err)) {
    return err.response?.data?.message ?? fallback;
  }
  return fallback;
}
