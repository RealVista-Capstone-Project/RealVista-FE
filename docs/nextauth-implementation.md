# NextAuth Implementation Guide

## Overview

This document describes the implementation of NextAuth.js v5 for the SEP project, replacing the custom Zustand-based JWT authentication system with a robust authentication solution supporting both Credentials provider (backend API) and Google OAuth, while implementing full RBAC capabilities.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Phase 1: Foundation](#phase-1-foundation)
3. [Phase 2: NextAuth Configuration](#phase-2-nextauth-configuration)
4. [Phase 3: Middleware & RBAC](#phase-3-middleware--rbac)
5. [Phase 4: FSD Layer Updates](#phase-4-fsd-layer-updates)
6. [Phase 5: HTTP Client Integration](#phase-5-http-client-integration)
7. [Phase 6: App Router Structure](#phase-6-app-router-structure)
8. [Phase 7: Server Components](#phase-7-server-components)
9. [Phase 8: Testing & Migration](#phase-8-testing--migration)
10. [Known Issues & Solutions](#known-issues--solutions)

---

## Architecture

### Current System

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │──────│  HTTP Client │──────│  Backend    │
│             │      │  (localStorage)│     │  API        │
└─────────────┘      └──────────────┘      └─────────────┘
       │
       ▼
┌──────────────┐
│ Zustand Store│
│ (auth-storage)│
└──────────────┘
```

**Issues:**
- Token storage mismatch (`localStorage.token` vs `localStorage.sessionToken`)
- No OAuth support
- Manual session management
- No built-in CSRF protection

### NextAuth System

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │──────│ NextAuth     │──────│  Backend    │
│             │      │ (JWT Session) │     │  API        │
└─────────────┘      └──────────────┘      └─────────────┘
       │                     │
       ▼                     ▼
┌──────────────┐      ┌──────────────┐
│ OAuth Provider│     │ httpOnly     │
│ (Google)     │     │ Cookies      │
└──────────────┘      └──────────────┘
```

**Benefits:**
- ✅ Secure httpOnly cookies
- ✅ Built-in CSRF protection
- ✅ OAuth provider support
- ✅ Automatic session management
- ✅ TypeScript support
- ✅ Server/client components

---

## Phase 1: Foundation

### 1.1 Install Dependencies

```bash
npm install next-auth@beta @auth/core
```

**Why:**
- `next-auth@beta` - NextAuth v5 for Next.js 15 compatibility
- `@auth/core` - Core authentication framework

### 1.2 Environment Variables

**Update `.env.example`:**

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-generate-with-openssl-rand-base64-32

# Backend API
NEXT_PUBLIC_API_ENDPOINT=http://localhost:8080/api/v1

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Generate NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

### 1.3 Update Environment Validation

**File:** `src/shared/lib/env/env.ts`

```typescript
export const env = createEnv({
  client: {
    NEXT_PUBLIC_URL: z.string().optional(),
    NEXT_PUBLIC_API_ENDPOINT: z.string().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url(),
  },
  shared: {
    NODE_ENV: z.enum(['test', 'development', 'production']).optional(),
    NEXTAUTH_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string().min(32),
  },
  server: {
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),
  },
  runtimeEnv: {
    // ... existing vars
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
});
```

---

## Phase 2: NextAuth Configuration

### 2.1 TypeScript Type Definitions

**Create:** `src/shared/lib/auth/types.ts`

```typescript
import type { DefaultSession } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      accessToken: string;
      role?: 'user' | 'admin' | 'moderator';
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    email: string;
    accessToken?: string;
    role?: 'user' | 'admin' | 'moderator';
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    email: string;
    accessToken?: string;
    refreshToken?: string;
    role?: 'user' | 'admin' | 'moderator';
  }
}
```

### 2.2 NextAuth Configuration

**Create:** `src/shared/lib/auth/config.ts`

```typescript
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { env } from '@/shared/lib/env';

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Call backend API
        const response = await fetch(`${env.NEXT_PUBLIC_API_ENDPOINT}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        });

        if (!response.ok) {
          return null;
        }

        const data = await response.json();

        // Backend returns: { access_token, type: "Bearer", userId, email }
        return {
          id: data.userId,
          email: data.email,
          accessToken: data.access_token,
        };
      },
    }),
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.accessToken = user.accessToken;
      }

      // Handle OAuth tokens
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.email = token.email as string;
      session.user.accessToken = token.accessToken as string;
      session.user.role = token.role as 'user' | 'admin' | 'moderator';
      return session;
    },

    async signIn({ user, account, profile }) {
      // For OAuth, you might want to create/update user in backend
      if (account?.provider === 'google') {
        // Call backend to sync/create user
        // This is optional depending on your requirements
        return true;
      }
      return true;
    },

    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnLoginPage = nextUrl.pathname.startsWith('/login');

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn && isOnLoginPage) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: env.NEXTAUTH_SECRET,
};
```

### 2.3 NextAuth Route Handler

**Create:** `app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from 'next-auth';
import { authConfig } from '@/shared/lib/auth/config';

const handler = NextAuth(authConfig);

export { handler as GET, handler as POST };
```

This creates the NextAuth API route at `/api/auth/[...nextauth]` which handles:
- `/api/auth/signin` - Sign in page
- `/api/auth/callback` - OAuth callbacks
- `/api/auth/session` - Get session
- `/api/auth/csrf` - CSRF token
- `/api/auth/signout` - Sign out

### 2.4 Auth Helpers

**Create:** `src/shared/lib/auth/index.ts`

```typescript
export { authConfig } from './config';
export type { Session, User } from './types';

/**
 * Get current session on server side
 */
export async function getSession() {
  'use server';
  const { getServerSession } = await import('next-auth/next');
  const { authConfig } = await import('./config');
  return getServerSession(authConfig);
}
```

---

## Phase 3: Middleware & RBAC

### 3.1 RBAC Utilities

**Create:** `src/shared/lib/auth/rbac.ts`

```typescript
import type { Session } from './types';

export const roles = {
  USER: 'user' as const,
  ADMIN: 'admin' as const,
  MODERATOR: 'moderator' as const,
} as const;

export type Role = typeof roles[keyof typeof roles];

/**
 * Check if user has required role
 */
export function hasRole(user: Session['user'] | null, requiredRole: Role): boolean {
  if (!user?.role) return false;

  // Admin has access to everything
  if (user.role === roles.ADMIN) return true;

  return user.role === requiredRole;
}

/**
 * Check if user has any of the required roles
 */
export function hasAnyRole(
  user: Session['user'] | null,
  requiredRoles: Role[]
): boolean {
  if (!user?.role) return false;

  if (user.role === roles.ADMIN) return true;

  return requiredRoles.includes(user.role as Role);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(user: Session['user'] | null): boolean {
  return !!user?.id;
}

/**
 * Get role hierarchy level (higher = more permissions)
 */
export function getRoleLevel(role: Role): number {
  const levels = {
    [roles.USER]: 1,
    [roles.MODERATOR]: 2,
    [roles.ADMIN]: 3,
  };
  return levels[role] || 0;
}

/**
 * Check if user has sufficient role level
 */
export function hasRoleLevel(user: Session['user'] | null, minLevel: number): boolean {
  if (!user?.role) return false;
  return getRoleLevel(user.role as Role) >= minLevel;
}
```

### 3.2 Update Middleware

**Update:** `src/middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Role-based route protection configuration
 */
const protectedRoutes = {
  '/dashboard': ['user', 'admin', 'moderator'],
  '/admin': ['admin'],
  '/moderator': ['admin', 'moderator'],
} as const;

const publicRoutes = ['/login', '/register', '/about', '/home'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Extract locale from pathname
  const localeMatch = pathname.match(/^\/([a-z]{2})(\/|$)/);
  const locale = localeMatch ? localeMatch[1] : 'vi';
  const pathWithoutLocale = localeMatch ? pathname.slice(3) : pathname;

  // Get session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;
  const userRole = token?.role as string | undefined;

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route =>
    pathWithoutLocale.startsWith(route)
  );

  if (isPublicRoute) {
    // Redirect authenticated users away from auth pages
    if (isAuthenticated && (pathWithoutLocale.startsWith('/login') || pathWithoutLocale.startsWith('/register'))) {
      const redirectUrl = `/${locale}/dashboard`;
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
    return NextResponse.next();
  }

  // Check protected routes
  for (const [route, allowedRoles] of Object.entries(protectedRoutes)) {
    if (pathWithoutLocale.startsWith(route)) {
      if (!isAuthenticated) {
        // Redirect to login with callback URL
        const loginUrl = `/${locale}/login?callbackUrl=${encodeURIComponent(pathname)}`;
        return NextResponse.redirect(new URL(loginUrl, request.url));
      }

      // Check role-based access
      if (allowedRoles.length > 0 && !allowedRoles.includes(userRole as any)) {
        // User doesn't have required role
        return NextResponse.redirect(new URL(`/${locale}/unauthorized`, request.url));
      }

      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|_next|public).*)',
  ],
};
```

---

## Phase 4: FSD Layer Updates

### 4.1 Update Auth Feature Hook

**Update:** `src/features/auth/model/use-auth.ts`

```typescript
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { hasRole, hasAnyRole, type Role } from '@/shared/lib/auth/rbac';

/**
 * useAuth Hook (NextAuth Version)
 * Authentication business logic layer
 * Wraps NextAuth session with app-specific functionality
 */
export function useAuth() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const user = session?.user || null;
  const isSessionLoading = status === 'loading';

  /**
   * Logout user and redirect to login
   */
  const logout = useCallback(async () => {
    await signOut({ redirect: false });
    router.push('/login');
  }, [router]);

  /**
   * Require authentication
   * Redirects to login if not authenticated
   */
  const requireAuth = useCallback(() => {
    if (!isAuthenticated(user)) {
      router.push('/login');
    }
  }, [user, router]);

  /**
   * Check if user has specific role
   */
  const hasRoleCheck = useCallback((role: Role) => {
    return hasRole(user, role);
  }, [user]);

  /**
   * Check if user has any of the specified roles
   */
  const hasAnyRoleCheck = useCallback((roles: Role[]) => {
    return hasAnyRole(user, roles);
  }, [user]);

  /**
   * Check if user is admin
   */
  const isAdmin = useCallback(() => hasRoleCheck('admin'), [hasRoleCheck]);

  /**
   * Check if user is moderator or admin
   */
  const isModerator = useCallback(() =>
    hasAnyRoleCheck(['moderator', 'admin']),
    [hasAnyRoleCheck]
  );

  return {
    user,
    session,
    isAuthenticated: isAuthenticated(user),
    isSessionLoading,
    logout,
    requireAuth,
    hasRole: hasRoleCheck,
    hasAnyRole: hasAnyRoleCheck,
    isAdmin,
    isModerator,
  };
}
```

### 4.2 Update Login Hook

**Update:** `src/features/auth/model/use-login.ts`

```typescript
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

/**
 * useLogin Hook (NextAuth Version)
 * Login functionality using NextAuth
 */
export function useLogin() {
  const router = useRouter();

  const login = async (credentials: { email: string; password: string }) => {
    const result = await signIn('credentials', {
      email: credentials.email,
      password: credentials.password,
      redirect: false,
    });

    if (result?.error) {
      return { error: result.error };
    }

    router.push('/dashboard');
    router.refresh();
    return { success: true };
  };

  const loginWithGoogle = async () => {
    const result = await signIn('google', {
      callbackUrl: '/dashboard',
    });

    if (result?.error) {
      return { error: result.error };
    }

    return { success: true };
  };

  return { login, loginWithGoogle };
}
```

### 4.3 Update Login Form UI

**Update:** `src/features/auth/ui/login-form.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { useLogin } from '../model/use-login';
import type { LoginCredentials } from '@/entities/user/model/types';

export function LoginForm() {
  const t = useTranslations('Auth');
  const { login, loginWithGoogle } = useLogin();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>();

  const onSubmit = async (data: LoginCredentials) => {
    setError('');
    setIsLoading(true);
    const result = await login(data);
    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    await loginWithGoogle();
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      {/* Google Login Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      {/* Credentials Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t('email')}</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            {...register('email', { required: 'Email is required' })}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t('password')}</Label>
          <Input
            id="password"
            type="password"
            {...register('password', { required: 'Password is required' })}
          />
          {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Logging in...' : t('login')}
        </Button>
      </form>
    </div>
  );
}
```

---

## Phase 5: HTTP Client Integration

### 5.1 Update HTTP Client

**Update:** `src/shared/lib/http/http.ts`

```typescript
/**
 * Get NextAuth session token on client side
 */
async function getClientToken(): Promise<string | null> {
  if (isClient()) {
    // Try localStorage first (legacy support during migration)
    const legacyToken = localStorage.getItem('sessionToken');
    if (legacyToken) return legacyToken;

    // Try NextAuth session
    try {
      const { getSession } = await import('next-auth/react');
      const session = await getSession();
      return session?.user?.accessToken || null;
    } catch {
      return null;
    }
  }
  return null;
}

const request = async <Response>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  options?: CustomOptions | undefined
) => {
  // ... existing code

  // Replace lines 60-65 with:
  const token = await getClientToken();
  if (token) {
    baseHeaders.Authorization = `Bearer ${token}`;
  }

  // ... rest of the function
};
```

---

## Phase 6: App Router Structure

### 6.1 Create Auth Route Group

**Create:** `app/[locale]/(auth)/login/page.tsx`

```typescript
import { LoginForm } from '@/features/auth/ui/login-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login</CardTitle>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </div>
  );
}
```

**Create:** `app/[locale]/(auth)/register/page.tsx`

```typescript
import { RegisterForm } from '@/features/auth/ui/register-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Account</CardTitle>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
}
```

### 6.2 Create Protected Route Group

**Create:** `app/[locale]/(protected)/dashboard/page.tsx`

```typescript
import { useAuth } from '@/features/auth/model/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export default function DashboardPage() {
  const { user, requireAuth } = useAuth();

  // Client-side protection (backup to middleware)
  requireAuth();

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>Email:</strong> {user?.email}
            </p>
            <p>
              <strong>Role:</strong> {user?.role}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Create:** `app/[locale]/(protected)/admin/page.tsx`

```typescript
import { useAuth } from '@/features/auth/model/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export default function AdminPage() {
  const { user, isAdmin, requireAuth } = useAuth();

  requireAuth();

  if (!isAdmin()) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200">
          <CardContent className="pt-6">
            <p className="text-red-600">Access Denied: Admin privileges required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin Panel</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Welcome, Admin {user?.email}</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 6.3 Update Root Layout

**Update:** `app/[locale]/layout.tsx`

```typescript
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import '@/app/styles/globals.css';
import { hasLocale, NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/shared/config/i18n/routing';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Create Next App',
  description: 'Generated by create next app',
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SessionProvider>
          <NextIntlClientProvider>{children}</NextIntlClientProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

---

## Phase 7: Server Components

### 7.1 Server-Side Session Helpers

**Create:** `src/shared/lib/auth/server.ts`

```typescript
import { getServerSession } from 'next-auth';
import { authConfig } from './config';
import { redirect } from 'next/navigation';

/**
 * Get current session on server side
 * Use this in Server Components and Route Handlers
 */
export async function getServerSession() {
  return getServerSession(authConfig);
}

/**
 * Require authentication on server side
 * Redirects to login if not authenticated
 */
export async function requireServerSession() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/login');
  }

  return session;
}

/**
 * Require specific role on server side
 * Redirects to unauthorized page if role doesn't match
 */
export async function requireServerRole(requiredRole: 'user' | 'admin' | 'moderator') {
  const session = await requireServerSession();

  const userRole = session.user?.role;

  // Admin has access to everything
  if (userRole === 'admin') return session;

  if (userRole !== requiredRole) {
    redirect('/unauthorized');
  }

  return session;
}
```

### 7.2 Server Component Example

**Example:** `app/[locale]/(protected)/profile/page.tsx`

```typescript
import { requireServerSession } from '@/shared/lib/auth/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

export default async function ProfilePage() {
  const session = await requireServerSession();

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{session.user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium">{session.user?.role}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Phase 8: Testing & Migration

### 8.1 Testing Checklist

**Authentication Flow:**
- [ ] User can log in with email/password
- [ ] User can log in with Google OAuth
- [ ] Session persists across page refreshes
- [ ] Logout works correctly
- [ ] Invalid credentials show error message

**Route Protection:**
- [ ] Protected routes redirect unauthenticated users to login
- [ ] Authenticated users redirected away from login/register
- [ ] Role-based access control works
- [ ] Unauthorized users see access denied page

**API Integration:**
- [ ] Authenticated requests include Bearer token
- [ ] Token is retrieved from NextAuth session
- [ ] 401 responses trigger redirect to login
- [ ] Backend API accepts NextAuth tokens

**Locale Routing:**
- [ ] Auth routes work with locale prefix (/vi/login, /en/login)
- [ ] Middleware preserves locale on redirects
- [ ] Login page respects current locale

### 8.2 Migration Strategy

**Phase 1 (Week 1):**
- Keep both systems running
- Install NextAuth alongside existing auth
- Test in development environment

**Phase 2 (Week 2):**
- Gradually migrate components to use NextAuth hooks
- Update protected pages to use NextAuth
- Keep Zustand store as fallback

**Phase 3 (Week 3):**
- Remove all localStorage token references
- Deprecate Zustand auth store
- Complete migration

**Phase 4 (Week 4):**
- Delete legacy code
- Update documentation
- Final testing

### 8.3 Rollback Plan

If critical issues occur:

1. **Quick Rollback:**
   - Revert middleware changes
   - Switch imports back to old hooks
   - Keep NextAuth installed but inactive

2. **Data Safety:**
   - Export existing sessions before migration
   - Backup user tokens
   - Document current auth state

---

## Known Issues & Solutions

### Issue 1: Token Field Name Mismatch

**Problem:** Backend returns `access_token` but NextAuth expects different format

**Solution:** Map in Credentials provider authorize function:
```typescript
return {
  id: data.userId,
  accessToken: data.access_token, // Map here
};
```

### Issue 2: OAuth Callback URL

**Problem:** Google OAuth redirects to wrong URL

**Solution:**
1. Set correct callback URL in Google Cloud Console: `http://localhost:3000/api/auth/callback/google`
2. Update NEXTAUTH_URL in `.env`
3. Ensure absolute URLs in development

### Issue 3: TypeScript Type Errors

**Problem:** NextAuth types conflict with existing types

**Solution:**
- Use module augmentation (as shown in Phase 2.1)
- Keep types in separate file
- Use proper `declare module` syntax

### Issue 4: Middleware Not Protecting Routes

**Problem:** Middleware matcher doesn't catch all routes

**Solution:**
```typescript
// Update matcher pattern
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|_next|public).*)',
  ],
};
```

### Issue 5: Session Not Persisting

**Problem:** User gets logged out on refresh

**Solution:**
- Ensure NEXTAUTH_SECRET is set
- Check cookie settings in browser
- Verify JWT configuration
- Check browser console for errors

### Issue 6: Backend API Integration

**Problem:** Backend expects different token format

**Solution:** Create adapter in HTTP client:
```typescript
async function getClientToken(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.accessToken || null;
}
```

### Issue 7: Locale Routing with NextAuth

**Problem:** NextAuth ignores locale prefix

**Solution:**
- Configure NextAuth pages with locale
- Use locale-aware redirects in callbacks
- Handle locale in middleware

### Issue 8: Role-Based Access Not Working

**Problem:** Users can access restricted pages

**Solution:**
- Ensure role is stored in JWT token
- Check middleware configuration
- Verify role checking logic
- Test with different user roles

---

## Security Considerations

### 1. Token Storage
- NextAuth uses httpOnly cookies (secure)
- No localStorage for sensitive tokens
- Automatic token rotation

### 2. CSRF Protection
- Built-in CSRF tokens
- Double-submit cookie pattern
- Automatic validation

### 3. OAuth Security
- PKCE flow for Google OAuth
- State parameter validation
- Secure token storage

### 4. RBAC Implementation
- Server-side verification required
- Never trust client-side role checks
- Always verify permissions on backend

---

## Performance Optimizations

### 1. Session Caching
```typescript
// Use staleTime for queries
staleTime: 5 * 60 * 1000, // 5 minutes
```

### 2. Selective Imports
```typescript
// Only import what you need
import { useSession } from 'next-auth/react';
```

### 3. Middleware Optimization
```typescript
// Exclude static files from middleware
matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
```

---

## References

- [NextAuth.js Documentation](https://authjs.dev/)
- [NextAuth v5 Guide](https://authjs.dev/guides/upgrade-to-v5)
- [Google OAuth Setup](https://console.cloud.google.com/apis/credentials)
- [Next.js 15 App Router](https://nextjs.org/docs/app)

---

## Support

For questions or issues:
1. Check this documentation
2. Review NextAuth.js official docs
3. Check implementation plan in Jira SEP-58
4. Contact frontend team

---

**Last Updated:** January 7, 2026
**Version:** 1.0.0
