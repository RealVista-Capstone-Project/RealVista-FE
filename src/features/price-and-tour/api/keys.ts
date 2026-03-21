export const appointmentKeys = {
  all: ['appointments'] as const,
  slots: (listingId: string, date: string) =>
    [...appointmentKeys.all, 'slots', listingId, date] as const,
};
