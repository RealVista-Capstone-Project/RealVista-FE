import { queryOptions } from '@tanstack/react-query';
import { appointmentApi } from './appointment.api';
import { appointmentKeys } from './keys';

export const appointmentQueries = {
  slots: (listingId: string, date: string) =>
    queryOptions({
      queryKey: appointmentKeys.slots(listingId, date),
      queryFn: async () => {
        const response = await appointmentApi.getAvailableSlots(listingId, date);
        return response;
      },
      enabled: !!listingId && !!date,
      staleTime: 5 * 60 * 1000,
    }),
};
