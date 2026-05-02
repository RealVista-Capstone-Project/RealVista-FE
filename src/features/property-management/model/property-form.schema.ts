import { z } from 'zod';
import { ATTRIBUTE_TYPES, PropertyAttribute } from '@/shared/config/property-types';

const uploadedMediaItemSchema = z.object({
  url: z.string().url(),
  type: z.enum(['IMAGE', 'VIDEO', 'VIRTUAL_TOUR', 'DOCUMENT']),
});

export function createPropertyInfoSchema(t: (key: string) => string) {
  return z
    .object({
      city: z.string().optional(),
      district: z.string().optional(),
      ward: z.string().optional(),
      streetAddress: z.string().min(1, t('validation.streetRequired')),
      location: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
      landSize: z.coerce
        .number({ invalid_type_error: t('validation.landSizeMin') })
        .min(1, t('validation.landSizeMin')),
      usableSize: z.coerce
        .number({ invalid_type_error: t('validation.usableSizeMin') })
        .min(1, t('validation.usableSizeMin')),
      width: z.coerce
        .number({ invalid_type_error: t('validation.widthMin') })
        .min(0, t('validation.widthMin')),
      length: z.coerce
        .number({ invalid_type_error: t('validation.lengthMin') })
        .min(0, t('validation.lengthMin')),
      propertyType: z.string().min(1, t('validation.propertyTypeRequired')),
      allowRentListingWhenRented: z.boolean().optional().default(false),
      dynamicAttributes: z.record(z.string(), z.any()).optional().default({}),
      amenityIds: z.array(z.string()).optional().default([]),
      priceRange: z
        .object({
          rent: z
            .object({
              min: z.coerce.number().min(0).optional(),
              max: z.coerce.number().min(0).optional(),
            })
            .optional(),
          buy: z
            .object({
              min: z.coerce.number().min(0).optional(),
              max: z.coerce.number().min(0).optional(),
            })
            .optional(),
        })
        .optional(),
    })
    .superRefine((data, ctx) => {
      if (
        data.usableSize != null &&
        data.landSize != null &&
        data.usableSize > data.landSize
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.usableSizeLtLandSize'),
          path: ['usableSize'],
        });
      }

      const rentMin = data.priceRange?.rent?.min;
      const rentMax = data.priceRange?.rent?.max;
      if (rentMin != null && rentMax != null && rentMax <= rentMin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.priceMaxGtMin'),
          path: ['priceRange', 'rent', 'max'],
        });
      }

      const buyMin = data.priceRange?.buy?.min;
      const buyMax = data.priceRange?.buy?.max;
      if (buyMin != null && buyMax != null && buyMax <= buyMin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.priceMaxGtMin'),
          path: ['priceRange', 'buy', 'max'],
        });
      }

      if (data.dynamicAttributes) {
        Object.entries(data.dynamicAttributes).forEach(([code, value]) => {
          const type = ATTRIBUTE_TYPES[code as PropertyAttribute];
          if (!type) return;

          const path = ['dynamicAttributes', code];

          if (type === 'number') {
            if (value === undefined || value === null || value === '') return;
            const numValue = Number(value);
            if (isNaN(numValue)) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t('validation.invalidNumber'),
                path,
              });
            } else if (numValue < 0) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: t('validation.numberMin'),
                path,
              });
            }
          } else if (type === 'boolean') {
            if (typeof value !== 'boolean' && value !== undefined && value !== null) {
              ctx.addIssue({
                code: z.ZodIssueCode.invalid_type,
                expected: 'boolean',
                received: typeof value,
                path,
              });
            }
          }
        });
      }
    });
}

export function createPropertyRoleSchema(t: (key: string) => string) {
  return z
    .object({
      role: z.enum(['OWNER', 'AGENT'], {
        required_error: t('validation.roleRequired'),
      }),
      ownerEmail: z.string().email(t('validation.invalidEmail')).optional().or(z.literal('')),
      ownerId: z.string().uuid().optional().or(z.literal('')),
      ownerName: z.string().optional(),
      ownerMaskedPhone: z.string().optional(),
      ownerPhone: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.role === 'AGENT' && !data.ownerId) {
          return false;
        }
        return true;
      },
      {
        message: t('validation.ownerRequired'),
        path: ['ownerEmail'],
      }
    );
}

export function createPropertyMediaSchema(t: (key: string) => string) {
  return z.object({
    images: z.array(uploadedMediaItemSchema).optional().default([]),
    videoUrl: z.string().url(t('validation.invalidUrl')).optional().or(z.literal('')),
    tour3dUrl: z.string().url(t('validation.invalidUrl')).optional().or(z.literal('')),
    newFiles: z.array(z.any()).optional().default([]),
  });
}

export function createPropertyFormSchema(t: (key: string) => string) {
  return z
    .object({
      role: createPropertyRoleSchema(t),
      info: z.any(),
      media: z.any(),
      isExistingProperty: z.boolean().optional().default(false),
      selectedPropertyId: z.string().uuid().nullable().optional(),
    })
    .superRefine((data, ctx) => {
      // If NOT an existing property, we must enforce required info/media fields
      if (!data.isExistingProperty) {
        const infoResult = createPropertyInfoSchema(t).safeParse(data.info);
        if (!infoResult.success) {
          infoResult.error.issues.forEach((issue) => {
            ctx.addIssue({
              ...issue,
              path: ['info', ...issue.path],
            });
          });
        }

        const mediaResult = createPropertyMediaSchema(t).safeParse(data.media);
        if (!mediaResult.success) {
          mediaResult.error.issues.forEach((issue) => {
            ctx.addIssue({
              ...issue,
              path: ['media', ...issue.path],
            });
          });
        }
      } else {
        // For existing properties, just ensure a property is selected
        if (!data.selectedPropertyId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('validation.selectionRequired') || 'Please select a property',
            path: ['selectedPropertyId'],
          });
        }
      }
    });
}

export type UploadedMediaItem = z.infer<typeof uploadedMediaItemSchema>;
export type PropertyInfoFormValues = z.infer<ReturnType<typeof createPropertyInfoSchema>>;
export type PropertyMediaFormValues = z.infer<ReturnType<typeof createPropertyMediaSchema>>;
export type PropertyFormValues = z.infer<ReturnType<typeof createPropertyFormSchema>>;
