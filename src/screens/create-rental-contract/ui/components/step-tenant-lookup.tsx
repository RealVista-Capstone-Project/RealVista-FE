import { Loader2, Search } from 'lucide-react';
import { Button, Input } from '@/shared/ui';
import { Field } from './shared';

interface FormTenantFields {
  tenantEmail: string;
  tenantName: string;
  tenantPhone: string;
  tenantLookupDone: boolean;
}

interface StepTenantLookupProps {
  form: FormTenantFields;
  isLoading: boolean;
  onEmailChange: (email: string) => void;
  onLookup: () => void;
  t: (key: string) => string;
}

export function StepTenantLookup({ form, isLoading, onEmailChange, onLookup, t }: StepTenantLookupProps) {
  return (
    <div className='space-y-6'>
      {/* Search box */}
      <div className='rounded-3xl border border-[#E9E0FF] bg-[#FBF9FF] p-5'>
        <p className='text-xs font-semibold uppercase tracking-[0.2em] text-main-primary/70'>
          {t('tenantLookup.eyebrow')}
        </p>
        <h3 className='mt-2 text-lg font-semibold text-main-black'>{t('tenantLookup.title')}</h3>
        <p className='mt-1 text-sm leading-6 text-main-secondary/65'>{t('tenantLookup.description')}</p>

        <div className='mt-4 flex gap-3'>
          <div className='flex-1'>
            <Input
              type='email'
              value={form.tenantEmail}
              onChange={(e) => onEmailChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  onLookup();
                }
              }}
              placeholder={t('tenantLookup.emailPlaceholder')}
              className='h-11 rounded-2xl border-[#E5DFFC] bg-white'
            />
          </div>
          <Button
            type='button'
            className='h-11 rounded-2xl bg-main-primary px-5 text-white shadow-[0_12px_24px_rgba(92,63,214,0.2)] hover:bg-main-primary-hover'
            onClick={onLookup}
            disabled={!form.tenantEmail.trim() || isLoading}
          >
            {isLoading ? <Loader2 className='h-4 w-4 animate-spin' /> : <Search className='h-4 w-4' />}
            {t('tenantLookup.lookupAction')}
          </Button>
        </div>
      </div>

      {/* Tenant details (shown after successful lookup) */}
      {form.tenantLookupDone && (
        <div className='grid gap-4 md:grid-cols-2'>
          <Field label={t('form.tenantName')}>
            <Input
              value={form.tenantName}
              readOnly
              className='h-11 rounded-xl border-[#E5DFFC] bg-[#F8F4FF] text-main-secondary/80'
            />
          </Field>
          <Field label={t('form.tenantPhone')}>
            <Input
              value={form.tenantPhone}
              readOnly
              className='h-11 rounded-xl border-[#E5DFFC] bg-[#F8F4FF] text-main-secondary/80'
            />
          </Field>
          <Field label={t('form.tenantEmail')} className='md:col-span-2'>
            <Input
              value={form.tenantEmail}
              readOnly
              className='h-11 rounded-xl border-[#E5DFFC] bg-[#F8F4FF] text-main-secondary/80'
            />
          </Field>
        </div>
      )}
    </div>
  );
}
