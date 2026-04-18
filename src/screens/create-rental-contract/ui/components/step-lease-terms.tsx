import { useState } from 'react';
import { Input } from '@/shared/ui';
import { Field, MoneyInput } from './shared';

interface FormLeaseFields {
  monthlyRent: string;
  securityDeposit: string;
  leaseStartDate: string;
  leaseEndDate: string;
}

interface StepLeaseTermsProps {
  form: FormLeaseFields;
  onFieldChange: (key: keyof FormLeaseFields, value: string) => void;
  t: (key: string, values?: Record<string, unknown>) => string;
}

const MIN_LEASE_MONTHS = 3;

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns YYYY-MM-DD string for `date + n months`, capped to end-of-month. */
function addMonths(dateStr: string, months: number): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  // setMonth handles year-rollover automatically; setDate(0) after
  // an overflow rolls back to the last day of the previous month.
  const result = new Date(d.getFullYear(), d.getMonth() + months, d.getDate());
  // Guard against day overflow (e.g. Jan 31 + 1 month → Feb 28/29)
  if (result.getDate() !== d.getDate()) {
    result.setDate(0); // last day of the correct month
  }
  return result.toISOString().slice(0, 10);
}

/** How many full calendar months between two YYYY-MM-DD strings. */
function monthsBetween(startStr: string, endStr: string): number {
  if (!startStr || !endStr) return 0;
  const s = new Date(startStr);
  const e = new Date(endStr);
  return (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
}

function validateDates(
  startDate: string,
  endDate: string,
  t: (key: string, values?: Record<string, unknown>) => string,
): { startError: string | null; endError: string | null } {
  const today = getTodayString();
  let startError: string | null = null;
  let endError: string | null = null;

  if (startDate && startDate < today) {
    startError = t('validation.startDatePast');
  }

  if (endDate && startDate) {
    if (endDate <= startDate) {
      endError = t('validation.endDateBeforeStart');
    } else if (monthsBetween(startDate, endDate) < MIN_LEASE_MONTHS) {
      endError = t('validation.durationTooShort');
    }
  }

  return { startError, endError };
}

export function StepLeaseTerms({ form, onFieldChange, t }: StepLeaseTermsProps) {
  const [touched, setTouched] = useState({ leaseStartDate: false, leaseEndDate: false, monthlyRent: false });

  const markTouched = (key: keyof typeof touched) =>
    setTouched((prev) => ({ ...prev, [key]: true }));

  const { startError, endError } = validateDates(form.leaseStartDate, form.leaseEndDate, t);
  const rentError = touched.monthlyRent && !form.monthlyRent ? t('validation.monthlyRentRequired') : null;

  const today = getTodayString();
  // The earliest selectable end date is start + MIN_LEASE_MONTHS (or today as fallback)
  const minEndDate = form.leaseStartDate ? addMonths(form.leaseStartDate, MIN_LEASE_MONTHS) : today;

  // Live duration display (full months)
  const durationMonths =
    form.leaseStartDate && form.leaseEndDate
      ? monthsBetween(form.leaseStartDate, form.leaseEndDate)
      : null;

  return (
    <div className='grid gap-4 md:grid-cols-2'>
      {/* Monthly rent */}
      <Field label={t('form.monthlyRent')}>
        <MoneyInput
          value={form.monthlyRent}
          onChange={(raw) => {
            onFieldChange('monthlyRent', raw);
            markTouched('monthlyRent');
          }}
          className='h-11 rounded-xl border-primary/10 bg-white/90'
        />
        {rentError && (
          <p className='mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive'>
            <span aria-hidden='true'>⚠</span>
            {rentError}
          </p>
        )}
      </Field>

      {/* Security deposit — no required validation */}
      <Field label={t('form.securityDeposit')}>
        <MoneyInput
          value={form.securityDeposit}
          onChange={(raw) => onFieldChange('securityDeposit', raw)}
          className='h-11 rounded-xl border-primary/10 bg-white/90'
        />
      </Field>

      {/* Lease start date */}
      <Field label={t('form.leaseStartDate')}>
        <Input
          type='date'
          value={form.leaseStartDate}
          min={today}
          onChange={(e) => {
            onFieldChange('leaseStartDate', e.target.value);
            markTouched('leaseStartDate');
            // Re-touch end date so its error updates immediately when start changes
            if (form.leaseEndDate) markTouched('leaseEndDate');
          }}
          onBlur={() => markTouched('leaseStartDate')}
          className={`h-11 rounded-xl border-primary/10 bg-white/90 ${
            touched.leaseStartDate && startError ? 'border-destructive focus-visible:ring-destructive/30' : ''
          }`}
        />
        {touched.leaseStartDate && startError && (
          <p className='mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive'>
            <span aria-hidden='true'>⚠</span>
            {startError}
          </p>
        )}
      </Field>

      {/* Lease end date */}
      <Field label={t('form.leaseEndDate')}>
        <Input
          type='date'
          value={form.leaseEndDate}
          min={minEndDate}
          onChange={(e) => {
            onFieldChange('leaseEndDate', e.target.value);
            markTouched('leaseEndDate');
          }}
          onBlur={() => markTouched('leaseEndDate')}
          className={`h-11 rounded-xl border-primary/10 bg-white/90 ${
            touched.leaseEndDate && endError ? 'border-destructive focus-visible:ring-destructive/30' : ''
          }`}
        />
        {touched.leaseEndDate && endError ? (
          <p className='mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive'>
            <span aria-hidden='true'>⚠</span>
            {endError}
          </p>
        ) : durationMonths !== null && durationMonths >= MIN_LEASE_MONTHS ? (
          <p className='mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-600'>
            <span aria-hidden='true'>✓</span>
            {t('validation.durationOk', { months: durationMonths })}
          </p>
        ) : (
          <p className='mt-1.5 text-xs text-muted-foreground'>
            {t('validation.durationHint', { min: MIN_LEASE_MONTHS })}
          </p>
        )}
      </Field>
    </div>
  );
}
