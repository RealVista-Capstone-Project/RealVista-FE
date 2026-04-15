export const appointmentKeys = {
  all: ['appointments'] as const,
  slots: (listingId: string, date: string) =>
    [...appointmentKeys.all, 'slots', listingId, date] as const,
  list: (startDate: string, endDate: string, filter?: string) =>
    [...appointmentKeys.all, 'list', startDate, endDate, filter] as const,
};
