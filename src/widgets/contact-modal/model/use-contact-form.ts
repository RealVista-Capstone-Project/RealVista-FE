'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { ContactFormData, UserContactInfo } from '@/entities/contact';

/**
 * Props for useContactForm hook
 */
interface UseContactFormProps {
  /**
   * Listing ID for the contact request
   */
  listingId: string;
  /**
   * Pre-fill form with user's contact info
   */
  userInfo?: UserContactInfo;
  /**
   * Callback when form is submitted successfully
   */
  onSubmit?: (data: ContactFormData) => void | Promise<void>;
}

/**
 * Hook to manage contact form state and submission
 */
export function useContactForm({ listingId, userInfo, onSubmit }: UseContactFormProps) {
  const form = useForm<ContactFormData>({
    defaultValues: {
      fullName: userInfo?.fullName ?? '',
      email: userInfo?.email ?? '',
      phone: userInfo?.phone ?? '',
      message: '',
      listingId,
    },
  });

  // Update form values when userInfo changes (e.g. after session loads)
  useEffect(() => {
    if (userInfo) {
      const currentValues = form.getValues();
      form.reset({
        ...currentValues,
        fullName: userInfo.fullName || currentValues.fullName,
        email: userInfo.email || currentValues.email,
        phone: userInfo.phone || currentValues.phone,
      });
    }
  }, [userInfo, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await onSubmit?.(data);
      form.reset({ ...form.getValues(), message: '' });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  });

  return {
    form,
    handleSubmit,
    isSubmitting: form.formState.isSubmitting,
    isValid: form.formState.isValid,
  };
}
