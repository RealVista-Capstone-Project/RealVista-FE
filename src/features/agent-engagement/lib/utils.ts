import { format } from 'date-fns';
import { vi, enUS } from 'date-fns/locale';

const localeMap: Record<string, typeof vi> = { vi, en: enUS };

export function formatDate(dateStr: string, pattern: string = 'dd MMM yyyy', locale: string = 'vi'): string {
  try {
    return format(new Date(dateStr), pattern, { locale: localeMap[locale] ?? vi });
  } catch {
    return dateStr;
  }
}

export function getInitials(name: string | null | undefined): string {
  if (!name) return '??';
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function getStatusColor(status: string | null | undefined) {
  switch ((status ?? '').toUpperCase()) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-700';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-700';
    case 'COMPLETED':
      return 'bg-blue-100 text-blue-700';
    case 'CANCELLED':
      return 'bg-red-100 text-red-700';
    case 'ACCEPTED':
      return 'bg-emerald-100 text-emerald-700';
    case 'REJECTED':
      return 'bg-rose-100 text-rose-700';
    case 'EXPIRED':
      return 'bg-gray-100 text-gray-600';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

export function formatRating(rating: number | null): string {
  if (rating === null || rating === undefined) return 'N/A';
  return rating.toFixed(1);
}

export function toStringArray(value: string[] | string | null | undefined): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') return value.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}
