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
  t: (key: string) => string;
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function validateDates(
  startDate: string,
  endDate: string,
  t: (key: string) => string,
): { startError: string | null; endError: string | null } {
  const today = getTodayString();
  let startError: string | null = null;
  let endError: string | null = null;

  if (startDate) {
    if (startDate < today) {
      startError = t('validation.startDatePast');
    }
  }

  if (endDate) {
    if (startDate && endDate <= startDate) {
      endError = t('validation.endDateBeforeStart');
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
          min={form.leaseStartDate || today}
          onChange={(e) => {
            onFieldChange('leaseEndDate', e.target.value);
            markTouched('leaseEndDate');
          }}
          onBlur={() => markTouched('leaseEndDate')}
          className={`h-11 rounded-xl border-primary/10 bg-white/90 ${
            touched.leaseEndDate && endError ? 'border-destructive focus-visible:ring-destructive/30' : ''
          }`}
        />
        {touched.leaseEndDate && endError && (
          <p className='mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive'>
            <span aria-hidden='true'>⚠</span>
            {endError}
          </p>
        )}
      </Field>
    </div>
  );
}
