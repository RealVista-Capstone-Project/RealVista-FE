export type AppointmentStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED' | 'COMPLETED';

export type AppointmentType = 'TOUR' | 'BLOCK';

export interface Appointment {
  appointment_id: string;
  listing_id: string;
  listing_name?: string;
  sender_id: string;
  sender_name?: string;
  receiver_id: string;
  receiver_name?: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  appointment_type: AppointmentType;
  sender_notes?: string;
  rejection_reason?: string;
  cancellation_reason?: string;
  canceled_by_user_id?: string;
  reminder_before?: number;
  created_at: string;
  updated_at: string;
  deleted: boolean;
  is_sender?: boolean;
}

export interface AppointmentWithListing extends Appointment {
  listing_name: string;
  listing_image?: string;
  listing_address: string;
  sender_name: string;
  receiver_name: string;
}

export interface AppointmentSlot {
  date: string;
  start_time: string;
  end_time: string;
  appointments: AppointmentWithListing[];
}

export interface DaySlots {
  date: string;
  day_name: string;
  day_number: number;
  month_number: number;
  slots: AppointmentSlot[];
}

export interface FetchAppointmentsParams {
  start_date: string;
  end_date: string;
  statuses?: string[];
}

export interface UpdateAppointmentStatusRequest {
  status: AppointmentStatus;
  reason?: string;
}