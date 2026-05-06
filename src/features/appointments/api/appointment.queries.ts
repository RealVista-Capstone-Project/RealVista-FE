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
        staleTime: 0, // Always fetch fresh data for appointments
        refetchInterval: 10000, // Polling every 10 seconds for real-time feel
        refetchOnWindowFocus: true,
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

export function useRescheduleAppointment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: { start_time: string; end_time: string; reason: string };
        }) => appointmentApi.reschedule(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
        },
    });
}

export function useRespondReschedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: { action: 'ACCEPT' | 'REJECT'; reason?: string };
        }) => appointmentApi.respondReschedule(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
        },
    });
}

export function useCancelReschedule() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (appointmentId: string) => appointmentApi.cancelReschedule(appointmentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
        },
    });
}