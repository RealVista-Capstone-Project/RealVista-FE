export function formatPublishedLifetimeLabel(
  hoursRemaining: number,
  t: (key: string, values?: Record<string, number>) => string
): string {
  const days = Math.floor(hoursRemaining / 24);

  if (hoursRemaining <= 0) {
    return t('lifetime.expired');
  }
  if (hoursRemaining < 24) {
    return t('lifetime.hoursRemaining', { count: hoursRemaining });
  }
  if (days === 1) {
    return t('lifetime.oneDayRemaining');
  }
  return t('lifetime.daysRemaining', { count: days });
}
