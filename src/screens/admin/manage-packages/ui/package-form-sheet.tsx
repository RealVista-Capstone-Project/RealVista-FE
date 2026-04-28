'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Loader2, Package, Rocket, Info } from 'lucide-react';

import {
  adminBillingApi,
  billingKeys,
  type FeaturePackage,
  type BoostPackage,
} from '@/entities/billing';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/shared/ui/sheet/sheet';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Separator } from '@/shared/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { cn } from '@/shared/lib/utils';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface SubscriptionFormValues {
  code: string;
  name: string;
  description: string;
  feature_type: FeaturePackage['feature_type'];
  quota: number;
  duration_days: number;
  price: number;
}

interface BoostFormValues {
  code: string;
  name: string;
  description: string;
  featured_quota: number;
  hot_badge_quota: number;
  duration_days: number;
  price: number;
}

interface PackageFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'subscription' | 'boost';
  editingPackage?: FeaturePackage | null;
  editingBoostPackage?: BoostPackage | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Field Row helper
// ─────────────────────────────────────────────────────────────────────────────

function FieldRow({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className='flex flex-col gap-1.5'>
      <Label className='text-sm font-semibold text-foreground flex items-center gap-1'>
        {label}
        {required && <span className='text-destructive'>*</span>}
      </Label>
      {children}
      {hint && !error && (
        <p className='flex items-center gap-1 text-[11px] text-muted-foreground'>
          <Info className='h-3 w-3 shrink-0' /> {hint}
        </p>
      )}
      {error && <p className='text-[11px] text-destructive font-medium'>{error}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subscription Form
// ─────────────────────────────────────────────────────────────────────────────

function SubscriptionForm({
  editing,
  onClose,
}: {
  editing: FeaturePackage | null;
  onClose: () => void;
}) {
  const t = useTranslations('ManagePackages');
  const queryClient = useQueryClient();
  const isEdit = !!editing;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionFormValues>({
    defaultValues: editing
      ? {
          code: editing.code,
          name: editing.name,
          description: editing.description ?? '',
          feature_type: editing.feature_type,
          quota: editing.quota,
          duration_days: editing.duration_days,
          price: editing.price,
        }
      : {
          code: '',
          name: '',
          description: '',
          feature_type: 'LISTING',
          quota: 10,
          duration_days: 30,
          price: 0,
        },
  });

  const onSubmit = async (data: SubscriptionFormValues) => {
    try {
      if (isEdit && editing) {
        await adminBillingApi.updateFeaturePackage(editing.id, {
          name: data.name,
          description: data.description || undefined,
          quota: data.quota,
          duration_days: data.duration_days,
          price: data.price,
        });
      } else {
        await adminBillingApi.createFeaturePackage({
          code: data.code,
          name: data.name,
          description: data.description || undefined,
          feature_type: data.feature_type,
          quota: data.quota,
          duration_days: data.duration_days,
          price: data.price,
        });
      }
      toast.success(t('form.saveSuccess'));
      void queryClient.invalidateQueries({ queryKey: billingKeys.adminFeaturePackages() });
      reset();
      onClose();
    } catch {
      toast.error(t('form.saveError'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5 pb-8'>
      {/* Code */}
      <FieldRow
        label={t('form.fields.code')}
        required
        hint='Unique identifier used internally (e.g. LISTING_10)'
        error={errors.code?.message}
      >
        <Input
          {...register('code', { required: t('form.validation.codeRequired') })}
          placeholder={t('form.fields.codePlaceholder')}
          disabled={isEdit}
          className={cn(
            'font-mono h-10',
            isEdit && 'bg-muted/50 text-muted-foreground cursor-not-allowed',
            errors.code && 'border-destructive focus:ring-destructive/20'
          )}
        />
      </FieldRow>

      {/* Name */}
      <FieldRow label={t('form.fields.name')} required error={errors.name?.message}>
        <Input
          {...register('name', { required: t('form.validation.nameRequired') })}
          placeholder={t('form.fields.namePlaceholder')}
          className={cn('h-10', errors.name && 'border-destructive focus:ring-destructive/20')}
        />
      </FieldRow>

      {/* Description */}
      <FieldRow label={t('form.fields.description')}>
        <textarea
          {...register('description')}
          placeholder={t('form.fields.descriptionPlaceholder')}
          rows={3}
          className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all resize-none'
        />
      </FieldRow>

      {/* Feature type — read-only on edit since the API doesn't accept it */}
      <FieldRow label={t('form.fields.featureType')} required>
        <Controller
          control={control}
          name='feature_type'
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={isEdit}>
              <SelectTrigger className={cn('h-10', isEdit && 'bg-muted/50 cursor-not-allowed')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='LISTING'>{t('featureType.LISTING')}</SelectItem>
                <SelectItem value='3D_TOUR'>{t('featureType.3D_TOUR')}</SelectItem>
                <SelectItem value='AI_REQUEST'>{t('featureType.AI_REQUEST')}</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </FieldRow>

      <Separator />

      {/* Quota & Duration side by side */}
      <div className='grid grid-cols-2 gap-4'>
        <FieldRow
          label={t('form.fields.quota')}
          required
          hint='-1 = unlimited'
          error={errors.quota?.message}
        >
          <Input
            type='number'
            {...register('quota', {
              valueAsNumber: true,
              required: t('form.validation.quotaPositive'),
              validate: (v) => v >= 1 || v === -1 || t('form.validation.quotaPositive'),
            })}
            placeholder={t('form.fields.quotaPlaceholder')}
            className={cn('h-10', errors.quota && 'border-destructive')}
          />
        </FieldRow>

        <FieldRow
          label={t('form.fields.durationDays')}
          required
          hint='-1 = no expiry'
          error={errors.duration_days?.message}
        >
          <Input
            type='number'
            {...register('duration_days', {
              valueAsNumber: true,
              required: t('form.validation.durationRequired'),
              validate: (v) => v >= 1 || v === -1 || t('form.validation.durationRequired'),
            })}
            placeholder={t('form.fields.durationPlaceholder')}
            className={cn('h-10', errors.duration_days && 'border-destructive')}
          />
        </FieldRow>
      </div>

      {/* Price */}
      <FieldRow label={t('form.fields.price')} required error={errors.price?.message}>
        <div className='relative'>
          <span className='absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium'>
            ₫
          </span>
          <Input
            type='number'
            {...register('price', {
              valueAsNumber: true,
              min: { value: 0, message: t('form.validation.priceNonNegative') },
            })}
            placeholder={t('form.fields.pricePlaceholder')}
            className={cn('h-10 pl-7', errors.price && 'border-destructive')}
          />
        </div>
      </FieldRow>

      {/* Actions */}
      <div className='flex items-center justify-end gap-3 pt-2'>
        <Button type='button' variant='ghost' onClick={onClose}>
          {t('actions.cancel')}
        </Button>
        <Button
          type='submit'
          disabled={isSubmitting}
          className='bg-primary text-primary-foreground hover:bg-primary/90 gap-2 min-w-[120px]'
        >
          {isSubmitting ? (
            <>
              <Loader2 className='h-4 w-4 animate-spin' />
              {t('form.saving')}
            </>
          ) : (
            t('form.save')
          )}
        </Button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Boost Form
// ─────────────────────────────────────────────────────────────────────────────

function BoostForm({
  editing,
  onClose,
}: {
  editing: BoostPackage | null;
  onClose: () => void;
}) {
  const t = useTranslations('ManagePackages');
  const queryClient = useQueryClient();
  const isEdit = !!editing;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<BoostFormValues>({
    defaultValues: editing
      ? {
          code: editing.code,
          name: editing.name,
          description: editing.description ?? '',
          featured_quota: editing.featured_quota,
          hot_badge_quota: editing.hot_badge_quota,
          duration_days: editing.duration_days,
          price: editing.price,
        }
      : {
          code: '',
          name: '',
          description: '',
          featured_quota: 5,
          hot_badge_quota: 3,
          duration_days: 30,
          price: 99000,
        },
  });

  const onSubmit = async (data: BoostFormValues) => {
    try {
      if (isEdit && editing) {
        await adminBillingApi.updateBoostPackage(editing.id, {
          name: data.name,
          description: data.description || undefined,
          featured_quota: data.featured_quota,
          hot_badge_quota: data.hot_badge_quota,
          duration_days: data.duration_days,
          price: data.price,
        });
      } else {
        await adminBillingApi.createBoostPackage({
          code: data.code,
          name: data.name,
          description: data.description || undefined,
          featured_quota: data.featured_quota,
          hot_badge_quota: data.hot_badge_quota,
          duration_days: data.duration_days,
          price: data.price,
        });
      }
      toast.success(t('form.saveSuccess'));
      void queryClient.invalidateQueries({ queryKey: billingKeys.adminBoostPackages() });
      reset();
      onClose();
    } catch {
      toast.error(t('form.saveError'));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='flex flex-col gap-5 pb-8'>
      {/* Code */}
      <FieldRow label={t('form.fields.code')} required hint='e.g. BOOST_PREMIUM' error={errors.code?.message}>
        <Input
          {...register('code', { required: t('form.validation.codeRequired') })}
          placeholder='e.g. BOOST_PREMIUM'
          disabled={isEdit}
          className={cn(
            'font-mono h-10',
            isEdit && 'bg-muted/50 text-muted-foreground cursor-not-allowed'
          )}
        />
      </FieldRow>

      {/* Name */}
      <FieldRow label={t('form.fields.name')} required error={errors.name?.message}>
        <Input
          {...register('name', { required: t('form.validation.nameRequired') })}
          placeholder='e.g. Premium Boost Pack'
          className='h-10'
        />
      </FieldRow>

      {/* Description */}
      <FieldRow label={t('form.fields.description')}>
        <textarea
          {...register('description')}
          placeholder={t('form.fields.descriptionPlaceholder')}
          rows={3}
          className='w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-primary transition-all resize-none'
        />
      </FieldRow>

      <Separator />

      {/* Quotas side by side */}
      <div className='grid grid-cols-2 gap-4'>
        <FieldRow label={t('form.fields.featuredQuota')} required error={errors.featured_quota?.message}>
          <Input
            type='number'
            {...register('featured_quota', {
              valueAsNumber: true,
              min: { value: 0, message: t('form.validation.quotaPositive') },
            })}
            placeholder={t('form.fields.featuredQuotaPlaceholder')}
            className='h-10'
          />
        </FieldRow>

        <FieldRow label={t('form.fields.hotBadgeQuota')} required error={errors.hot_badge_quota?.message}>
          <Input
            type='number'
            {...register('hot_badge_quota', {
              valueAsNumber: true,
              min: { value: 0, message: t('form.validation.quotaPositive') },
            })}
            placeholder={t('form.fields.hotBadgePlaceholder')}
            className='h-10'
          />
        </FieldRow>
      </div>

      {/* Duration */}
      <FieldRow
        label={t('form.fields.durationDays')}
        required
        hint='-1 = no expiry'
        error={errors.duration_days?.message}
      >
        <Input
          type='number'
          {...register('duration_days', {
            valueAsNumber: true,
            required: t('form.validation.durationRequired'),
            validate: (v) => v >= 1 || v === -1 || t('form.validation.durationRequired'),
          })}
          placeholder='e.g. 30'
          className='h-10'
        />
      </FieldRow>

      {/* Price */}
      <FieldRow label={t('form.fields.price')} required error={errors.price?.message}>
        <div className='relative'>
          <span className='absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium'>
            ₫
          </span>
          <Input
            type='number'
            {...register('price', {
              valueAsNumber: true,
              min: { value: 0, message: t('form.validation.priceNonNegative') },
            })}
            placeholder={t('form.fields.pricePlaceholder')}
            className={cn('h-10 pl-7', errors.price && 'border-destructive')}
          />
        </div>
      </FieldRow>

      {/* Actions */}
      <div className='flex items-center justify-end gap-3 pt-2'>
        <Button type='button' variant='ghost' onClick={onClose}>
          {t('actions.cancel')}
        </Button>
        <Button
          type='submit'
          disabled={isSubmitting}
          className='bg-primary text-primary-foreground hover:bg-primary/90 gap-2 min-w-[120px]'
        >
          {isSubmitting ? (
            <>
              <Loader2 className='h-4 w-4 animate-spin' />
              {t('form.saving')}
            </>
          ) : (
            t('form.save')
          )}
        </Button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────────────────

export function PackageFormSheet({
  open,
  onOpenChange,
  type,
  editingPackage,
  editingBoostPackage,
}: PackageFormSheetProps) {
  const t = useTranslations('ManagePackages');
  const isEdit = type === 'subscription' ? !!editingPackage : !!editingBoostPackage;

  const titleKey =
    type === 'subscription'
      ? isEdit
        ? 'form.editSubscriptionTitle'
        : 'form.addSubscriptionTitle'
      : isEdit
        ? 'form.editBoostTitle'
        : 'form.addBoostTitle';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className='w-full max-w-md sm:max-w-lg flex flex-col gap-0 p-0 overflow-y-auto'
      >
        <SheetHeader className='px-6 py-5 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent shrink-0'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-primary/10 rounded-lg border border-primary/20'>
              {type === 'subscription' ? (
                <Package className='h-5 w-5 text-primary' />
              ) : (
                <Rocket className='h-5 w-5 text-primary' />
              )}
            </div>
            <div>
              <SheetTitle className='text-base font-bold'>{t(titleKey as any)}</SheetTitle>
              <SheetDescription className='text-xs mt-0.5'>
                {isEdit
                  ? 'Update existing package details'
                  : 'Fill in the details for the new package'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className='flex-1 px-6 py-5'>
          {type === 'subscription' ? (
            <SubscriptionForm
              editing={editingPackage ?? null}
              onClose={() => onOpenChange(false)}
            />
          ) : (
            <BoostForm
              editing={editingBoostPackage ?? null}
              onClose={() => onOpenChange(false)}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
