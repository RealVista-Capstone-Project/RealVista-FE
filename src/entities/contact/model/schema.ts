import { z } from 'zod';

/**
 * Creates a Zod schema for the contact form, using the provided translation function for error messages.
 * @param t The translation function from next-intl (e.g., useTranslations('Contact'))
 */
export const getContactFormSchema = (t: (key: string) => string) => {
  return z.object({
    fullName: z.string().min(1, { message: t('validation.fullNameRequired') }),
    email: z
      .string()
      .min(1, { message: t('validation.emailRequired') })
      .email({ message: t('validation.emailInvalid') }),
    phone: z
      .string()
      .min(1, { message: t('validation.phoneRequired') })
      .regex(/^[+]?[0-9]{9,15}$/, { message: t('validation.phoneInvalid') }),
    message: z
      .string()
      .min(1, { message: t('validation.messageRequired') })
      .min(10, { message: t('validation.messageMinLength') }),
    listingId: z.string(),
  });
};

export type ContactFormSchemaType = z.infer<ReturnType<typeof getContactFormSchema>>;
