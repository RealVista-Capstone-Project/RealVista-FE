import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentApi } from '@/features/price-and-tour/api/appointment.api';
import { appointmentKeys } from '@/features/price-and-tour/api/keys';
import type {
  FetchAppointmentsParams,
  UpdateAppointmentStatusRequest,
} from '../types/appointment';

export function useAppointments(params: FetchAppointmentsParams) {
  return useQuery({
    queryKey: appointmentKeys.list(
      params.startDate,
      params.endDate,
      params.filter
    ),
    queryFn: () => appointmentApi.fetchAppointments(params),
  });
}

export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAppointmentStatusRequest;
    }) => appointmentApi.updateAppointmentStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
    },
  });
}