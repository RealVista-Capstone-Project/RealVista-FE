import http from '@/shared/lib/http';
import { ApiResponse } from '@/shared/types';

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
};
