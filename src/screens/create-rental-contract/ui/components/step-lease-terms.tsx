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

export function StepLeaseTerms({ form, onFieldChange, t }: StepLeaseTermsProps) {
  return (
    <div className='grid gap-4 md:grid-cols-2'>
      <Field label={t('form.monthlyRent')}>
        <MoneyInput
          value={form.monthlyRent}
          onChange={(raw) => onFieldChange('monthlyRent', raw)}
          className='h-11 rounded-xl border-[#E5DFFC] bg-white/90'
        />
      </Field>
      <Field label={t('form.securityDeposit')}>
        <MoneyInput
          value={form.securityDeposit}
          onChange={(raw) => onFieldChange('securityDeposit', raw)}
          className='h-11 rounded-xl border-[#E5DFFC] bg-white/90'
        />
      </Field>
      <Field label={t('form.leaseStartDate')}>
        <Input
          type='date'
          value={form.leaseStartDate}
          onChange={(e) => onFieldChange('leaseStartDate', e.target.value)}
          className='h-11 rounded-xl border-[#E5DFFC] bg-white/90'
        />
      </Field>
      <Field label={t('form.leaseEndDate')}>
        <Input
          type='date'
          value={form.leaseEndDate}
          onChange={(e) => onFieldChange('leaseEndDate', e.target.value)}
          className='h-11 rounded-xl border-[#E5DFFC] bg-white/90'
        />
      </Field>
    </div>
  );
}
