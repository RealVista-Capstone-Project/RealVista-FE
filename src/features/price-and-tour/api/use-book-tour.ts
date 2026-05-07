import { useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentApi, BookTourRequest } from './appointment.api';
import { appointmentKeys } from './keys';

export function useBookTour() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BookTourRequest) => appointmentApi.bookTour(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}
