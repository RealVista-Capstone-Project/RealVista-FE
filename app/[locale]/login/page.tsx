import { LoginFormNextAuth } from '@/features/auth/ui/login-form-nextauth';

/**
 * Login Page
 *
 * NextAuth-powered login form.
 * Uses Credentials provider for authentication.
 *
 * Features:
 * - Email/password authentication
 * - NextAuth session management
 * - Toast notifications for success/error
 * - Automatic redirect to dashboard on success
 */
export default function LoginPage() {
  return <LoginFormNextAuth />;
}
