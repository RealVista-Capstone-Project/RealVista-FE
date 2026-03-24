import { z } from 'zod';

const uploadedMediaItemSchema = z.object({
  url: z.string().url(),
  type: z.enum(['IMAGE', 'VIDEO', 'VIRTUAL_TOUR', 'DOCUMENT']),
});

export function createPropertyInfoSchema(t: (key: string) => string) {
  return z.object({
    city: z.string().min(1, t('validation.cityRequired')),
    district: z.string().min(1, t('validation.districtRequired')),
    ward: z.string().min(1, t('validation.wardRequired')),
    streetAddress: z.string().min(1, t('validation.streetRequired')),
    location: z.object({
      lat: z.number(),
      lng: z.number(),
    }),
    landSize: z.coerce.number().min(1, t('validation.landSizeMin')),
    usableSize: z.coerce.number().min(1, t('validation.usableSizeMin')),
    width: z.coerce.number().min(0, t('validation.widthMin')),
    length: z.coerce.number().min(0, t('validation.lengthMin')),
    propertyType: z.string().min(1, t('validation.propertyTypeRequired')),
    dynamicAttributes: z.record(z.string(), z.any()).optional().default({}),
    amenityIds: z.array(z.string()).optional().default([]),
  });
}

export function createPropertyMediaSchema(t: (key: string) => string) {
  return z.object({
    images: z.array(uploadedMediaItemSchema).optional().default([]),
    videoUrl: z.string().url(t('validation.invalidUrl')).optional().or(z.literal('')),
    tour3dUrl: z.string().url(t('validation.invalidUrl')).optional().or(z.literal('')),
  });
}

export function createPropertyFormSchema(t: (key: string) => string) {
  return z.object({
    info: createPropertyInfoSchema(t),
    media: createPropertyMediaSchema(t),
  });
}

export type UploadedMediaItem = z.infer<typeof uploadedMediaItemSchema>;
export type PropertyInfoFormValues = z.infer<ReturnType<typeof createPropertyInfoSchema>>;
export type PropertyMediaFormValues = z.infer<ReturnType<typeof createPropertyMediaSchema>>;
export type PropertyFormValues = z.infer<ReturnType<typeof createPropertyFormSchema>>;
