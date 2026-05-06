import { queryOptions } from '@tanstack/react-query';
import { appointmentApi } from './appointment.api';
import { appointmentKeys } from './keys';

export const appointmentQueries = {
  slots: (listingId: string, date: string, excludeId?: string) =>
    queryOptions({
      queryKey: [...appointmentKeys.slots(listingId, date), excludeId],
      queryFn: async () => {
        const response = await appointmentApi.getAvailableSlots(listingId, date, excludeId);
        return response;
      },
      enabled: !!listingId && !!date,
      staleTime: 30 * 1000, // 30 seconds
      refetchInterval: 30 * 1000, // Polling slots every 30 seconds
    }),
};
