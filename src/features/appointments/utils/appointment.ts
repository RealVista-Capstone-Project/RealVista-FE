import { Appointment, AppointmentStatus } from '../types/appointment';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Returns true if the given string is a valid UUID v4.
 * Used to distinguish persisted DB records from locally-drawn blocks (nanoid).
 */
export const isValidUUID = (id: string): boolean => UUID_REGEX.test(id);

/**
 * Robust date parsing: Replace space with 'T' for ISO compliance.
 * Some backends return "YYYY-MM-DD HH:mm:ss" which is not valid ISO 8601.
 */
export const parseAppointmentDate = (dateStr: string): Date => {
  const normalized = dateStr.includes(' ') && !dateStr.includes('T')
    ? dateStr.replace(' ', 'T')
    : dateStr;
  return new Date(normalized);
};

/**
 * Formats a Date + "HH:mm" time string to a local ISO datetime string
 * (no timezone offset), e.g. "2024-06-15T09:30:00".
 */
export const toLocalIso = (date: Date, timeStr: string): string => {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
};

/**
 * Checks if an appointment can be accepted by the current user.
 * Rules:
 * - Must be the receiver
 * - Status must be PENDING
 */
export const canAcceptAppointment = (
  appointment: Appointment,
  currentUserId?: string
): boolean => {
  if (!currentUserId) return false;
  return appointment.receiver_id === currentUserId && appointment.status === 'PENDING';
};

/**
 * Checks if an appointment can be canceled or rejected by the current user.
 * Rules:
 * - Must be a participant (sender or receiver)
 * - Status must be PENDING or ACCEPTED
 * - Must be at least 4 hours before the start time
 */
export const canCancelAppointment = (
  appointment: Appointment,
  currentUserId?: string
): boolean => {
  if (!currentUserId) return false;

  const isSender = appointment.sender_id === currentUserId || appointment.is_sender === true;
  const isReceiver = appointment.receiver_id === currentUserId;
  const isParticipant = isSender || isReceiver;

  const isValidStatus =
    appointment.status === 'PENDING' ||
    appointment.status === 'ACCEPTED';

  if (!isParticipant || !isValidStatus) return false;

  const startTime = parseAppointmentDate(appointment.start_time);
  const now = new Date();

  if (isNaN(startTime.getTime())) return false;

  const fourHoursInMs = 4 * 60 * 60 * 1000;
  return startTime.getTime() - now.getTime() > fourHoursInMs;
};

/**
 * Gets the color classes for a status badge.
 */
export const getStatusColorClasses = (status: AppointmentStatus): string => {
  const configs: Record<AppointmentStatus, string> = {
    PENDING: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300',
    ACCEPTED: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
    REJECTED: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
    CANCELED: 'bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300',
    COMPLETED: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  };
  return configs[status] || '';
};
