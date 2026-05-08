'use client';

import { useFieldArray, useFormContext, Controller } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Plus, Trash2, Receipt } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Textarea } from '@/shared/ui/textarea';
import { Switch } from '@/shared/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { cn } from '@/shared/lib/utils';
import type { PropertyFormValues } from '../model/property-form.schema';
import { FEE_TYPES, BILLING_CYCLES } from '../model/property-form.schema';
import { PriceInput } from './components/price-input';

const fieldInputClass =
  'h-12 rounded-lg border border-primary/20 bg-white px-4 text-sm shadow-none transition-colors placeholder:text-muted-foreground/50 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none';

const selectTriggerClass =
  'h-12 w-full rounded-lg border border-primary/20 bg-white px-4 text-sm shadow-none data-[placeholder]:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:ring-offset-0';

const textareaClass =
  'min-h-[4.5rem] rounded-lg border border-primary/20 bg-white px-4 py-3 text-sm shadow-none transition-colors placeholder:text-muted-foreground/50 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:outline-none resize-y';

export function PropertyFeesStep() {
  const t = useTranslations('PropertyManagement');
  const {
    register,
    control,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<PropertyFormValues>();

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'fees',
  });

  const fees = watch('fees') ?? [];

  const handleAddFee = () => {
    append({
      feeType: 'OTHER',
      feeName: '',
      amount: 0,
      billingCycle: 'MONTHLY',
      isOptional: false,
      description: '',
    });
  };

  const feesErrors = (errors.fees as { message?: string }[] | undefined) ?? [];

  return (
    <div className='flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500'>
      <div>
        <h2 className='flex items-center gap-2 text-lg font-bold tracking-tight text-foreground'>
          <Receipt className='size-5 shrink-0 text-primary' strokeWidth={2} />
          {t('feesTitle')}
        </h2>
        <p className='mt-1 text-sm text-muted-foreground'>{t('feesDesc')}</p>
      </div>

      {fields.length > 0 && (
        <div className='flex flex-col gap-4'>
          {fields.map((field, index) => {
            const fieldErrors = (feesErrors[index] ?? {}) as Record<string, { message?: string }>;
            const isOptional = fees[index]?.isOptional ?? false;

            return (
              <div
                key={field.id}
                className='relative flex flex-col gap-4 rounded-xl border border-primary/20 bg-white p-4 sm:p-5 sm:pr-12'
              >
                <button
                  type='button'
                  onClick={() => remove(index)}
                  className='absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-lg border border-primary/15 text-muted-foreground transition-colors hover:border-destructive/30 hover:bg-destructive/5 hover:text-destructive'
                  aria-label={t('feesRemove')}
                >
                  <Trash2 className='size-4' strokeWidth={2} />
                </button>

                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5'>
                  <div className='flex flex-col gap-2'>
                    <Label className='text-sm font-medium text-foreground'>{t('feeType')}</Label>
                    <Select
                      value={fees[index]?.feeType ?? 'OTHER'}
                      onValueChange={(val) =>
                        setValue(`fees.${index}.feeType`, val as (typeof FEE_TYPES)[number], {
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          selectTriggerClass,
                          fieldErrors.feeType &&
                            'border-destructive focus:ring-destructive/25'
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FEE_TYPES.map((type) => {
                          const label = t(`feeTypeLabel_${type}`);
                          return (
                            <SelectItem key={type} value={type} textValue={label}>
                              {label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {fieldErrors.feeType && (
                      <p className='text-xs font-medium text-destructive'>
                        {fieldErrors.feeType.message}
                      </p>
                    )}
                  </div>

                  <div className='flex flex-col gap-2'>
                    <Label className='text-sm font-medium text-foreground'>{t('feeName')}</Label>
                    <Input
                      {...register(`fees.${index}.feeName`)}
                      placeholder={t('feeNamePlaceholder')}
                      className={cn(
                        fieldInputClass,
                        fieldErrors.feeName &&
                          'border-destructive focus-visible:ring-destructive/25'
                      )}
                    />
                    {fieldErrors.feeName && (
                      <p className='text-xs font-medium text-destructive'>
                        {fieldErrors.feeName.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5'>
                  <div className='flex flex-col gap-2'>
                    <Label className='text-sm font-medium text-foreground'>{t('feeAmount')}</Label>
                    <Controller
                      control={control}
                      name={`fees.${index}.amount`}
                      render={({ field }) => (
                        <PriceInput
                          value={field.value}
                          onChange={(v) => field.onChange(v ?? 0)}
                          onBlur={field.onBlur}
                          placeholder='0'
                          className={
                            fieldErrors.amount
                              ? '!border-destructive focus-within:!border-destructive focus-within:!ring-destructive/25'
                              : undefined
                          }
                        />
                      )}
                    />
                    {fieldErrors.amount && (
                      <p className='text-xs font-medium text-destructive'>
                        {fieldErrors.amount.message}
                      </p>
                    )}
                  </div>

                  <div className='flex flex-col gap-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      {t('feeBillingCycle')}
                    </Label>
                    <Select
                      value={fees[index]?.billingCycle ?? 'MONTHLY'}
                      onValueChange={(val) =>
                        setValue(`fees.${index}.billingCycle`, val as (typeof BILLING_CYCLES)[number], {
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          selectTriggerClass,
                          fieldErrors.billingCycle &&
                            'border-destructive focus:ring-destructive/25'
                        )}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {BILLING_CYCLES.map((cycle) => {
                          const label = t(`feeBillingCycleLabel_${cycle}`);
                          return (
                            <SelectItem key={cycle} value={cycle} textValue={label}>
                              {label}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    {fieldErrors.billingCycle && (
                      <p className='text-xs font-medium text-destructive'>
                        {fieldErrors.billingCycle.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className='flex flex-col gap-4'>
                  <div className='flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/[0.03] px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='flex items-center gap-3'>
                      <Switch
                        id={`fee-optional-${index}`}
                        checked={isOptional}
                        onCheckedChange={(checked) =>
                          setValue(`fees.${index}.isOptional`, checked, { shouldValidate: true })
                        }
                      />
                      <Label
                        htmlFor={`fee-optional-${index}`}
                        className='cursor-pointer text-sm font-medium text-foreground'
                      >
                        {t('feeOptional')}
                      </Label>
                    </div>
                    <span className='text-xs text-muted-foreground sm:text-right'>
                      {isOptional ? t('feeOptionalHint') : t('feeRequiredHint')}
                    </span>
                  </div>

                  <div className='flex flex-col gap-2'>
                    <Label className='text-sm font-medium text-foreground'>
                      {t('feeDescription')}
                    </Label>
                    <Textarea
                      {...register(`fees.${index}.description`)}
                      placeholder={t('feeDescriptionPlaceholder')}
                      className={cn(textareaClass)}
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {fields.length === 0 ? (
        <button
          type='button'
          onClick={handleAddFee}
          className={cn(
            'flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 px-6 py-8 text-center transition-colors',
            'hover:border-primary/40 hover:bg-primary/[0.08]'
          )}
        >
          <Plus className='mb-2 size-7 shrink-0 text-primary/60' strokeWidth={2} />
          <p className='text-sm font-medium text-muted-foreground'>{t('feesEmptyTitle')}</p>
          <p className='mt-0.5 text-xs text-muted-foreground/70'>{t('feesAdd')}</p>
        </button>
      ) : null}

      {fields.length > 0 ? (
        <button
          type='button'
          onClick={handleAddFee}
          className={cn(
            'flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 px-4 py-5 text-center transition-colors',
            'hover:border-primary/40 hover:bg-primary/[0.08]'
          )}
        >
          <Plus className='mb-2 size-6 shrink-0 text-primary/60' strokeWidth={2} />
          <p className='text-sm font-medium text-muted-foreground'>{t('feesAdd')}</p>
          <p className='mt-0.5 text-xs text-muted-foreground/70'>{t('feesEmptyDesc')}</p>
        </button>
      ) : null}
    </div>
  );
}
