export type AppointmentStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELED' | 'COMPLETED';

export type AppointmentType = 'TOUR' | 'BLOCK';

export interface Appointment {
  appointmentId: string;
  listingId: string;
  senderId: string;
  receiverId: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  appointmentType: AppointmentType;
  senderNotes?: string;
  rejectionReason?: string;
  cancellationReason?: string;
  canceledByUserId?: string;
  reminderBefore?: number;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}

export interface AppointmentWithListing extends Appointment {
  listingName: string;
  listingImage?: string;
  listingAddress: string;
  senderName: string;
  receiverName: string;
}

export interface AppointmentSlot {
  date: string;
  startTime: string;
  endTime: string;
  appointments: AppointmentWithListing[];
}

export interface DaySlots {
  date: string;
  dayName: string;
  dayNumber: number;
  monthNumber: number;
  slots: AppointmentSlot[];
}

export interface FetchAppointmentsParams {
  startDate: string;
  endDate: string;
  filter?: 'all' | 'sent' | 'received';
}

export interface UpdateAppointmentStatusRequest {
  status: AppointmentStatus;
  reason?: string;
}