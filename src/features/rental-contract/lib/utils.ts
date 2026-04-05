import { RentalContractStatus } from '@/entities/rental-contract';
import { format } from 'date-fns';
import { enUS, vi } from 'date-fns/locale';

const dateLocales = {
  en: enUS,
  vi,
};

export function formatContractDate(date: string, locale = 'en', pattern = 'dd MMM yyyy') {
  return format(new Date(date), pattern, {
    locale: dateLocales[locale as keyof typeof dateLocales] ?? enUS,
  });
}

export function formatContractCurrency(amount: number, locale = 'vi-VN') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getContractInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function getRentalContractStatusColor(status: RentalContractStatus) {
  switch (status) {
    case RentalContractStatus.DRAFT:
      return 'bg-slate-100 text-slate-700 border border-slate-200';
    case RentalContractStatus.PENDING_RENTER:
      return 'bg-amber-50 text-amber-700 border border-amber-200';
    case RentalContractStatus.PENDING_LANDLORD:
      return 'bg-orange-50 text-orange-700 border border-orange-200';
    case RentalContractStatus.ACTIVE:
      return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
    case RentalContractStatus.EXPIRED:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
    case RentalContractStatus.TERMINATED:
      return 'bg-violet-50 text-violet-700 border border-violet-200';
    case RentalContractStatus.REJECTED:
      return 'bg-red-50 text-red-700 border border-red-200';
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200';
  }
}
