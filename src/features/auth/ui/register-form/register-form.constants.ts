/** Password rule definition used in strength meter and checklist. */
export interface PasswordRule {
  id: string;
  label: string;
  test: (value: string) => boolean;
}

/**
 * Password strength levels and their corresponding UI properties.
 * Must be kept in sync with the Zod schema constraints in register-form.schema.ts.
 */
export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length', label: 'Ít nhất 8 ký tự', test: (v) => v.length >= 8 },
  { id: 'upper', label: 'Có ít nhất 1 chữ hoa (A-Z)', test: (v) => /[A-Z]/.test(v) },
  { id: 'lower', label: 'Có ít nhất 1 chữ thường (a-z)', test: (v) => /[a-z]/.test(v) },
  { id: 'number', label: 'Có ít nhất 1 số (0-9)', test: (v) => /[0-9]/.test(v) },
  {
    id: 'special',
    label: 'Có ít nhất 1 ký tự đặc biệt (!@#$…)',
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

export interface PasswordStrength {
  level: number;
  label: string;
  color: string;
}

const STRENGTH_LEVELS: PasswordStrength[] = [
  { level: 0, label: 'Rất yếu', color: 'bg-red-500' },
  { level: 1, label: 'Yếu', color: 'bg-orange-400' },
  { level: 2, label: 'Trung bình', color: 'bg-yellow-400' },
  { level: 3, label: 'Mạnh', color: 'bg-lime-500' },
  { level: 4, label: 'Rất mạnh', color: 'bg-green-500' },
];

/** Maps number of passed password rules (0-5) to a PasswordStrength descriptor. */
export function getStrength(passedCount: number): PasswordStrength {
  const index = Math.min(passedCount, STRENGTH_LEVELS.length - 1);
  return STRENGTH_LEVELS[index];
}
