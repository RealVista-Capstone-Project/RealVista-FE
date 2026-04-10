'use client';

import * as React from 'react';
import { Plus, Edit3, Percent, Award, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Textarea } from '@/shared/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/shared/ui/select';
import { PROPERTY_TYPES } from '@/shared/config/property-types';
import { AgentProposal, ApplyAgentProposalPayload } from '@/entities/agent-proposal/model/types';
import { VndAmountInput } from '@/shared/ui/vnd-amount-input';

/* ─── Form validation ─── */
interface FormErrors {
  title?: string;
  commission_rate?: string;
  experience_years?: string;
  pitch_content?: string;
  specialty?: string;
  price_range?: string;
}

function validateForm(
  form: ApplyAgentProposalPayload,
  t: ReturnType<typeof useTranslations<'ManageProposals'>>
): FormErrors {
  const errors: FormErrors = {};

  if (!form.title.trim()) {
    errors.title = t('validation.titleRequired');
  } else if (form.title.trim().length < 5) {
    errors.title = t('validation.titleTooShort');
  } else if (form.title.trim().length > 200) {
    errors.title = t('validation.titleTooLong');
  }

  if (form.commission_rate <= 0) {
    errors.commission_rate = t('validation.commissionMin');
  } else if (form.commission_rate > 100) {
    errors.commission_rate = t('validation.commissionMax');
  }

  if (form.experience_years < 0) {
    errors.experience_years = t('validation.experienceMin');
  } else if (form.experience_years > 60) {
    errors.experience_years = t('validation.experienceMax');
  }

  if (!form.pitch_content.trim()) {
    errors.pitch_content = t('validation.pitchRequired');
  } else if (form.pitch_content.trim().length < 50) {
    errors.pitch_content = t('validation.pitchTooShort');
  } else if (form.pitch_content.trim().length > 2000) {
    errors.pitch_content = t('validation.pitchTooLong');
  }

  const pr = form.price_range;
  const rent = pr?.rent;
  const sale = pr?.sale;
  const rentInvalid =
    rent != null &&
    rent.min > 0 &&
    rent.max > 0 &&
    rent.min > rent.max;
  const saleInvalid =
    sale != null &&
    sale.min > 0 &&
    sale.max > 0 &&
    sale.min > sale.max;
  if (rentInvalid || saleInvalid) {
    errors.price_range = t('validation.priceRangeMinMax');
  }

  return errors;
}

/* ─── Field Component ─── */
function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className='space-y-1.5'>
      <div className='flex items-center justify-between'>
        <label className='text-sm font-medium text-slate-700'>
          {label}
          {required && <span className='ml-0.5 text-red-500'>*</span>}
        </label>
        {hint && !error && <span className='text-xs text-slate-400'>{hint}</span>}
        {error && <span className='text-xs text-red-500'>{error}</span>}
      </div>
      {children}
    </div>
  );
}

const INPUT_CLASS =
  'w-full min-w-0 rounded-lg border bg-white px-3 py-2 text-sm tabular-nums text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all';
const INPUT_DEFAULT = `${INPUT_CLASS} border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20`;
const INPUT_ERROR = `${INPUT_CLASS} border-red-300 focus:border-red-500 focus:ring-red-500/20`;

/* ─── Main Component ─── */
interface ProposalFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  initialData: AgentProposal | null;
  onSubmit: (payload: ApplyAgentProposalPayload) => void;
  isLoading: boolean;
}

export function ProposalFormDialog({
  isOpen,
  onClose,
  mode,
  initialData,
  onSubmit,
  isLoading,
}: ProposalFormDialogProps) {
  const t = useTranslations('ManageProposals');

  const defaultForm: ApplyAgentProposalPayload = {
    title: '',
    commission_rate: 1.5,
    experience_years: 3,
    pitch_content: '',
    specialty: '',
    price_range: {
      rent: { min: 0, max: 0 },
      sale: { min: 0, max: 0 },
    },
  };

  const [form, setForm] = React.useState<ApplyAgentProposalPayload>(defaultForm);
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [touched, setTouched] = React.useState<
    Partial<Record<keyof ApplyAgentProposalPayload, boolean>>
  >({});

  // Sync form with initialData when dialog opens
  React.useEffect(() => {
    if (!isOpen) return;
    if (mode === 'edit' && initialData) {
      setForm({
        title: initialData.title,
        commission_rate: initialData.commission_rate,
        experience_years: initialData.experience_years,
        pitch_content: initialData.pitch_content,
        specialty: initialData.specialty || '',
        price_range: initialData.price_range || {
          rent: { min: 0, max: 0 },
          sale: { min: 0, max: 0 },
        },
      });
    } else {
      setForm(defaultForm);
    }
    setErrors({});
    setTouched({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, initialData]);

  // Real-time validation on touched fields
  React.useEffect(() => {
    if (Object.keys(touched).length > 0) {
      const newErrors = validateForm(form, t);
      const filteredErrors: FormErrors = {};
      (Object.keys(touched) as Array<keyof ApplyAgentProposalPayload>).forEach((key) => {
        if (touched[key] && newErrors[key]) {
          (filteredErrors as any)[key] = (newErrors as any)[key];
        }
      });
      setErrors(filteredErrors);
    }
  }, [form, touched, t]);

  const update = (k: keyof ApplyAgentProposalPayload, v: any) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    setTouched((prev) => ({ ...prev, [k]: true }));
  };

  const updatePriceRange = (type: 'rent' | 'sale', field: 'min' | 'max', value: number) => {
    setForm((prev) => ({
      ...prev,
      price_range: {
        ...prev.price_range,
        [type]: {
          ...prev.price_range?.[type],
          [field]: value,
        },
      },
    }));
    setTouched((prev) => ({ ...prev, price_range: true }));
  };

  const isFormValid = Object.keys(validateForm(form, t)).length === 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all fields as touched to show all errors
    setTouched({
      title: true,
      commission_rate: true,
      experience_years: true,
      pitch_content: true,
      specialty: true,
      price_range: true,
    });
    const allErrors = validateForm(form, t);
    setErrors(allErrors);
    if (Object.keys(allErrors).length > 0) return;
    onSubmit(form);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='w-[calc(100vw-1.5rem)] max-w-[min(100vw-1.5rem,52rem)] sm:w-full sm:max-w-[52rem] p-0 gap-0 rounded-2xl border border-slate-200 shadow-2xl overflow-hidden bg-white'>
        {/* ── Dialog Header ── */}
        <DialogHeader className='px-6 pt-6 pb-4 border-b border-slate-100'>
          <div className='flex items-center gap-3'>
            <div className='flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600'>
              {mode === 'create' ? <Plus size={18} strokeWidth={2.5} /> : <Edit3 size={18} />}
            </div>
            <div>
              <DialogTitle className='text-base font-bold text-slate-900'>
                {mode === 'create' ? t('formCreateTitle') : t('formEditTitle')}
              </DialogTitle>
              <DialogDescription className='text-xs text-slate-400 mt-0.5'>
                {mode === 'create' ? t('formCreateSubtitle') : t('formEditSubtitle')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* ── Form Body ── */}
        <form onSubmit={handleSubmit} className='flex flex-col' noValidate>
          <div className='px-6 py-5 space-y-5 max-h-[62vh] overflow-y-auto'>
            {/* Title */}
            <Field label={t('fieldTitle')} required error={errors.title}>
              <input
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
                placeholder={t('fieldTitlePlaceholder')}
                className={errors.title ? INPUT_ERROR : INPUT_DEFAULT}
                autoComplete='off'
              />
            </Field>

            {/* Commission & Experience */}
            <div className='grid grid-cols-2 gap-4'>
              <Field label={t('fieldCommission')} required error={errors.commission_rate}>
                <div className='relative'>
                  <input
                    type='number'
                    step='0.1'
                    min='0'
                    max='100'
                    value={form.commission_rate}
                    onChange={(e) => update('commission_rate', parseFloat(e.target.value) || 0)}
                    onBlur={() => setTouched((prev) => ({ ...prev, commission_rate: true }))}
                    className={cn(errors.commission_rate ? INPUT_ERROR : INPUT_DEFAULT, 'pr-8')}
                  />
                  <Percent
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'
                    size={14}
                  />
                </div>
              </Field>
              <Field label={t('fieldExperience')} required error={errors.experience_years}>
                <div className='relative'>
                  <input
                    type='number'
                    min='0'
                    max='60'
                    value={form.experience_years}
                    onChange={(e) => update('experience_years', parseInt(e.target.value) || 0)}
                    onBlur={() => setTouched((prev) => ({ ...prev, experience_years: true }))}
                    className={cn(errors.experience_years ? INPUT_ERROR : INPUT_DEFAULT, 'pr-8')}
                  />
                  <Award
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none'
                    size={14}
                  />
                </div>
              </Field>
            </div>
            <br />
            {/* Specialty Field */}
            <Field label={t('fieldSpecialty')} error={errors.specialty}>
              <Select value={form.specialty} onValueChange={(v) => update('specialty', v)}>
                <SelectTrigger
                  className={cn(errors.specialty ? INPUT_ERROR : INPUT_DEFAULT, 'h-10')}
                >
                  <SelectValue placeholder={t('fieldSpecialtyPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {PROPERTY_TYPES.map((cat) => (
                    <SelectGroup key={cat.code}>
                      <SelectLabel className='text-[10px] font-bold text-slate-400 px-2 py-1.5 uppercase tracking-wider'>
                        {cat.label}
                      </SelectLabel>
                      {cat.types.map((type) => (
                        <SelectItem key={type.code} value={type.code} className='text-sm'>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Price Range Fields */}
            <div className='space-y-3.5'>
              <div>
                <div className='flex items-start justify-between gap-2 mb-1'>
                  <label className='text-sm font-medium text-slate-700'>
                    {t('fieldPriceRange')}
                  </label>
                  {errors.price_range && (
                    <span className='text-xs text-red-500 shrink-0'>{errors.price_range}</span>
                  )}
                </div>
                <p className='text-[11px] text-slate-400 mb-1 leading-relaxed'>
                  {t('fieldPriceRangeDescription')}
                </p>
                <p className='text-[11px] text-slate-500 mb-3 leading-relaxed'>
                  {t('fieldPriceRangeHint')}
                </p>
              </div>

              <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-5'>
                {/* Rent Range */}
                <div className='space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 min-w-0'>
                  <span className='text-[11px] font-bold text-indigo-600 uppercase tracking-wider'>
                    {t('rentRange')}
                  </span>
                  <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4'>
                    <div className='min-w-0'>
                      <span className='text-[10px] font-medium text-slate-500 block mb-1.5'>
                        {t('minPrice')}
                      </span>
                      <VndAmountInput
                        value={form.price_range?.rent?.min ?? 0}
                        onChange={(n) => updatePriceRange('rent', 'min', n)}
                        inputClassName={
                          errors.price_range ? INPUT_ERROR : INPUT_DEFAULT
                        }
                        placeholder={t('minPrice')}
                      />
                    </div>
                    <div className='min-w-0'>
                      <span className='text-[10px] font-medium text-slate-500 block mb-1.5'>
                        {t('maxPrice')}
                      </span>
                      <VndAmountInput
                        value={form.price_range?.rent?.max ?? 0}
                        onChange={(n) => updatePriceRange('rent', 'max', n)}
                        inputClassName={
                          errors.price_range ? INPUT_ERROR : INPUT_DEFAULT
                        }
                        placeholder={t('maxPrice')}
                      />
                    </div>
                  </div>
                </div>

                {/* Sale Range */}
                <div className='space-y-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 min-w-0'>
                  <span className='text-[11px] font-bold text-violet-600 uppercase tracking-wider'>
                    {t('saleRange')}
                  </span>
                  <div className='grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4'>
                    <div className='min-w-0'>
                      <span className='text-[10px] font-medium text-slate-500 block mb-1.5'>
                        {t('minPrice')}
                      </span>
                      <VndAmountInput
                        value={form.price_range?.sale?.min ?? 0}
                        onChange={(n) => updatePriceRange('sale', 'min', n)}
                        inputClassName={
                          errors.price_range ? INPUT_ERROR : INPUT_DEFAULT
                        }
                        placeholder={t('minPrice')}
                      />
                    </div>
                    <div className='min-w-0'>
                      <span className='text-[10px] font-medium text-slate-500 block mb-1.5'>
                        {t('maxPrice')}
                      </span>
                      <VndAmountInput
                        value={form.price_range?.sale?.max ?? 0}
                        onChange={(n) => updatePriceRange('sale', 'max', n)}
                        inputClassName={
                          errors.price_range ? INPUT_ERROR : INPUT_DEFAULT
                        }
                        placeholder={t('maxPrice')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pitch content */}
            <Field
              label={t('fieldPitch')}
              required
              error={errors.pitch_content}
              hint={t('fieldCharCount', { count: form.pitch_content.length })}
            >
              <Textarea
                value={form.pitch_content}
                onChange={(e) => update('pitch_content', e.target.value)}
                onBlur={() => setTouched((prev) => ({ ...prev, pitch_content: true }))}
                placeholder={t('fieldPitchPlaceholder')}
                className={cn(
                  'w-full rounded-lg border px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all min-h-[160px] resize-y leading-relaxed',
                  errors.pitch_content
                    ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20'
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20'
                )}
              />
              {/* Character progress */}
              <div className='flex justify-between mt-1'>
                <span className='text-[10px] text-slate-400'>Min. 50 ký tự</span>
                <div className='flex items-center gap-2'>
                  <div className='w-24 h-1 rounded-full bg-slate-100 overflow-hidden'>
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        form.pitch_content.length < 50
                          ? 'bg-red-400'
                          : form.pitch_content.length > 1800
                            ? 'bg-amber-400'
                            : 'bg-emerald-400'
                      )}
                      style={{
                        width: `${Math.min((form.pitch_content.length / 2000) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <span
                    className={cn(
                      'text-[10px] font-medium',
                      form.pitch_content.length > 2000 ? 'text-red-500' : 'text-slate-400'
                    )}
                  >
                    {form.pitch_content.length}/2000
                  </span>
                </div>
              </div>
            </Field>
          </div>

          {/* ── Footer ── */}
          <div className='flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4'>
            <DialogClose asChild>
              <Button
                type='button'
                variant='ghost'
                className='h-9 rounded-lg px-4 text-sm font-medium text-slate-600 hover:bg-slate-100'
              >
                {t('btnCancel')}
              </Button>
            </DialogClose>
            <Button
              type='submit'
              disabled={isLoading || !isFormValid}
              className='h-9 rounded-lg px-5 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? (
                <span className='flex items-center gap-2'>
                  <Clock size={14} className='animate-spin' />
                  {t('btnSaving')}
                </span>
              ) : mode === 'create' ? (
                t('btnCreate')
              ) : (
                t('btnSave')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ');
}
