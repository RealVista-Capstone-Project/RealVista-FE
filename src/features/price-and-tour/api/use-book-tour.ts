import { useMutation } from '@tanstack/react-query';
import { appointmentApi, BookTourRequest } from './appointment.api';

export function useBookTour() {
  return useMutation({
    mutationFn: (data: BookTourRequest) => appointmentApi.bookTour(data),
  });
}
