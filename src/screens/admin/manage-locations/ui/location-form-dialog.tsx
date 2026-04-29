'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { useCities, useChildrenLocations } from '@/entities/location/api/use-locations';
import { useCreateLocation } from '@/entities/location/api/use-create-location';
import { useUpdateLocation } from '@/entities/location/api/use-update-location';
import type { LocationResponse, LocationLevel } from '@/entities/location/api/location-api.types';

const buildSchema = (t: (key: string) => string, isEdit: boolean) =>
  z
    .object({
      level: z.enum(['CITY', 'DISTRICT', 'WARD']),
      name: z.string().min(1, t('validation.nameRequired')),
      code: z
        .string()
        .min(1, t('validation.codeRequired'))
        .regex(/^[A-Za-z0-9_-]+$/, t('validation.codeInvalid')),
      parent_city_id: z.string().optional(),
      parent_district_id: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (isEdit) return; // parent fields are not editable — skip validation
      if (data.level === 'DISTRICT' && !data.parent_city_id) {
        ctx.addIssue({ code: 'custom', path: ['parent_city_id'], message: t('validation.cityRequired') });
      }
      if (data.level === 'WARD' && !data.parent_city_id) {
        ctx.addIssue({ code: 'custom', path: ['parent_city_id'], message: t('validation.cityRequired') });
      }
      if (data.level === 'WARD' && !data.parent_district_id) {
        ctx.addIssue({
          code: 'custom',
          path: ['parent_district_id'],
          message: t('validation.districtRequired'),
        });
      }
    });

type FormValues = z.infer<ReturnType<typeof buildSchema>>;

interface LocationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a location to edit; omit for create */
  location?: LocationResponse;
}

export function LocationFormDialog({ open, onOpenChange, location }: LocationFormDialogProps) {
  const t = useTranslations('ManageLocations');
  const isEdit = !!location;

  const schema = React.useMemo(() => buildSchema(t, isEdit), [t, isEdit]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      level: (location?.level as LocationLevel) ?? 'CITY',
      name: location?.name ?? '',
      code: location?.code ?? '',
      parent_city_id: undefined,
      parent_district_id: undefined,
    },
  });

  // Reset form when dialog opens or location changes
  React.useEffect(() => {
    if (open) {
      reset({
        level: (location?.level as LocationLevel) ?? 'CITY',
        name: location?.name ?? '',
        code: location?.code ?? '',
        parent_city_id: undefined,
        parent_district_id: undefined,
      });
    }
  }, [open, location, reset]);

  const level = watch('level');
  const selectedCityId = watch('parent_city_id');

  const { data: cities = [] } = useCities();
  const { data: districts = [] } = useChildrenLocations(
    level === 'WARD' ? selectedCityId : undefined
  );

  const createLocation = useCreateLocation();
  const updateLocation = useUpdateLocation();

  const isPending = createLocation.isPending || updateLocation.isPending;

  const onSubmit = (values: FormValues) => {
    const parentId =
      values.level === 'DISTRICT'
        ? values.parent_city_id
        : values.level === 'WARD'
          ? values.parent_district_id
          : undefined;

    if (isEdit) {
      updateLocation.mutate(
        { id: location.location_id, req: { name: values.name, code: values.code } },
        {
          onSuccess: () => {
            toast.success(t('toast.updateSuccess'));
            onOpenChange(false);
          },
          onError: () => toast.error(t('toast.updateError')),
        }
      );
    } else {
      createLocation.mutate(
        { level: values.level, name: values.name, code: values.code, parent_id: parentId },
        {
          onSuccess: () => {
            toast.success(t('toast.createSuccess'));
            onOpenChange(false);
          },
          onError: () => toast.error(t('toast.createError')),
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{isEdit ? t('form.editTitle') : t('form.addTitle')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4 py-2'>
          {/* Level */}
          <div className='space-y-1.5'>
            <Label htmlFor='level'>{t('form.level')}</Label>
            <Controller
              name='level'
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={isEdit}>
                  <SelectTrigger id='level'>
                    <SelectValue placeholder={t('form.selectLevel')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='CITY'>{t('levels.CITY')}</SelectItem>
                    <SelectItem value='DISTRICT'>{t('levels.DISTRICT')}</SelectItem>
                    <SelectItem value='WARD'>{t('levels.WARD')}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {errors.level && <p className='text-xs text-destructive'>{errors.level.message}</p>}
          </div>

          {/* Parent City (District & Ward) */}
          {(level === 'DISTRICT' || level === 'WARD') && (
            <div className='space-y-1.5'>
              <Label htmlFor='parent_city_id'>{t('form.parentCity')}</Label>
              <Controller
                name='parent_city_id'
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                    disabled={isEdit}
                  >
                    <SelectTrigger id='parent_city_id'>
                      <SelectValue placeholder={t('form.selectCity')} />
                    </SelectTrigger>
                    <SelectContent>
                      {cities.map((city) => (
                        <SelectItem key={city.location_id} value={city.location_id}>
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.parent_city_id && (
                <p className='text-xs text-destructive'>{errors.parent_city_id.message}</p>
              )}
            </div>
          )}

          {/* Parent District (Ward only) */}
          {level === 'WARD' && (
            <div className='space-y-1.5'>
              <Label htmlFor='parent_district_id'>{t('form.parentDistrict')}</Label>
              <Controller
                name='parent_district_id'
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? ''}
                    onValueChange={field.onChange}
                    disabled={isEdit || !selectedCityId}
                  >
                    <SelectTrigger id='parent_district_id'>
                      <SelectValue
                        placeholder={
                          selectedCityId ? t('form.selectDistrict') : t('filters.selectCityFirst')
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((district) => (
                        <SelectItem key={district.location_id} value={district.location_id}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.parent_district_id && (
                <p className='text-xs text-destructive'>{errors.parent_district_id.message}</p>
              )}
            </div>
          )}

          {/* Name */}
          <div className='space-y-1.5'>
            <Label htmlFor='name'>{t('form.name')}</Label>
            <Input id='name' placeholder={t('form.namePlaceholder')} {...register('name')} />
            {errors.name && <p className='text-xs text-destructive'>{errors.name.message}</p>}
          </div>

          {/* Code */}
          <div className='space-y-1.5'>
            <Label htmlFor='code'>{t('form.code')}</Label>
            <Input id='code' placeholder={t('form.codePlaceholder')} {...register('code')} />
            {errors.code && <p className='text-xs text-destructive'>{errors.code.message}</p>}
          </div>

          <DialogFooter className='pt-2'>
            <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
              {t('form.cancel')}
            </Button>
            <Button type='submit' disabled={isPending}>
              {isPending
                ? t('form.saving')
                : isEdit
                  ? t('form.save')
                  : t('form.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
