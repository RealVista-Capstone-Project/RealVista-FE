import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentApi } from '@/features/price-and-tour/api/appointment.api';
import { appointmentKeys } from '@/features/price-and-tour/api/keys';
import type {
    FetchAppointmentsParams,
    UpdateAppointmentStatusRequest,
} from '../types/appointment';

export function useAppointments(params: FetchAppointmentsParams) {
    return useQuery({
        queryKey: appointmentKeys.list(params.start_date, params.end_date),
        queryFn: () => appointmentApi.fetchAppointments(params),
        staleTime: 1 * 60 * 1000,
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

export function useSyncBlocks() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            blocks: { start_time: string; end_time: string; appointment_id?: string }[];
            start_date: string;
            end_date: string;
        }) => appointmentApi.syncBlocks(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
        },
    });
}

export function useDeleteAppointment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (appointmentId: string) => appointmentApi.deleteAppointment(appointmentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
        },
    });
}