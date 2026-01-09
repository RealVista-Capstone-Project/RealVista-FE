import { LoginFormNextAuth } from '@/features/auth/ui/login-form-nextauth';
import { GoogleLoginButton } from '@/features/auth/ui/google-login-button';

/**
 * Login Page
 *
 * NextAuth-powered login page with email/password and Google OAuth options.
 *
 * Features:
 * - Email/password authentication via NextAuth Credentials provider
 * - Google OAuth login via backend OAuth flow
 * - Visual separator between login methods
 * - Locale-aware routing (supports /vi and /en)
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 px-4">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account to continue
          </p>
        </div>

        {/* Email/Password Form */}
        <div className="space-y-4">
          <LoginFormNextAuth />
        </div>

        {/* Visual Separator */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <div className="space-y-4">
          <GoogleLoginButton />
        </div>

        {/* Footer Links */}
        <div className="text-center text-sm">
          <p className="text-muted-foreground">
            Don't have an account?{' '}
            <a
              href="/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
