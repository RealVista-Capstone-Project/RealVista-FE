import { z } from 'zod';

/**
 * Password rules aligned with backend CreateUserRequest / ResetPasswordRequest.
 */
export const passwordFieldSchema = z
  .string()
  .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
  .max(128, 'Mật khẩu tối đa 128 ký tự')
  .regex(/[A-Z]/, 'Phải có ít nhất 1 chữ hoa')
  .regex(/[a-z]/, 'Phải có ít nhất 1 chữ thường')
  .regex(/[0-9]/, 'Phải có ít nhất 1 số')
  .regex(/[^A-Za-z0-9]/, 'Phải có ít nhất 1 ký tự đặc biệt');

/**
 * Register form Zod schema.
 * Mirrors backend Jakarta Validation constraints exactly:
 * - Password: min 8, max 128, uppercase, lowercase, number, special char
 */
export const registerSchema = z
  .object({
    firstName: z.string().min(1, 'Họ là bắt buộc').max(100, 'Tối đa 100 ký tự'),
    lastName: z.string().min(1, 'Tên là bắt buộc').max(100, 'Tối đa 100 ký tự'),
    email: z.string().min(1, 'Email là bắt buộc').email('Địa chỉ email không hợp lệ'),
    phoneNumber: z
      .string()
      .min(1, 'Số điện thoại là bắt buộc')
      .regex(/^\+?[0-9]{10,15}$/, 'Định dạng số điện thoại không hợp lệ'),
    password: passwordFieldSchema,
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  });

export type RegisterFormValues = z.infer<typeof registerSchema>;

export const resetPasswordFormSchema = z
  .object({
    password: passwordFieldSchema,
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp',
    path: ['confirmPassword'],
  });

export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>;
