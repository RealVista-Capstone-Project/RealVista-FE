import http from '@/shared/lib/http';
import { ApiResponse } from '@/shared/types';
import type {
  AppointmentWithListing,
  FetchAppointmentsParams,
  UpdateAppointmentStatusRequest,
} from '@/features/appointments/types';

export interface BookTourRequest {
  listing_id: string;
  selected_slots: string[]; // ISO strings
  notes?: string;
}

export const appointmentApi = {
  getAvailableSlots: async (listingId: string, date: string) => {
    // date format: YYYY-MM-DD
    const response = await http.get<ApiResponse<string[]>>(
      `/appointments/slots?listing_id=${listingId}&date=${date}`
    );
    return response;
  },

  bookTour: async (data: BookTourRequest): Promise<void> => {
    await http.post('/appointments', data);
  },

  fetchAppointments: async (params: FetchAppointmentsParams) => {
    const searchParams = new URLSearchParams({
      start_date: params.start_date,
      end_date: params.end_date,
    });
    if (params.statuses && params.statuses.length > 0) {
      params.statuses.forEach((s) => searchParams.append('statuses', s));
    }

    const response = await http.get<ApiResponse<AppointmentWithListing[]>>(
      `/appointments?${searchParams.toString()}`
    );
    return response.payload.data;
  },

  updateAppointmentStatus: async (
    appointmentId: string,
    data: UpdateAppointmentStatusRequest
  ): Promise<void> => {
    await http.patch(`/appointments/${appointmentId}`, data);
  },

  syncBlocks: async (data: {
    blocks: { start_time: string; end_time: string; appointment_id?: string }[];
    start_date: string; // ISO datetime: "2026-04-13T00:00:00"
    end_date: string;   // ISO datetime: "2026-04-19T23:59:59"
  }): Promise<void> => {
    await http.post('/appointments/blocks/sync', data);
  },

  deleteAppointment: async (appointmentId: string): Promise<void> => {
    await http.delete(`/appointments/${appointmentId}`);
  },
};
