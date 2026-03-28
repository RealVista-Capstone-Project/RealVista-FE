'use client';

import { useEffect } from 'react';
import { useAuthSession } from '@/features/auth/model';
import { useRouter } from '@/shared/config/i18n/navigation';
import type { UserRole, BackendRole } from './rbac';
import { hasRole } from './rbac';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  /** Optional: Allow specific backend roles even if their mapped frontend role is not in allowedRoles */
  allowedBackendRoles?: BackendRole[];
  fallback?: React.ReactNode;
  redirectPath?: string;
}

/**
 * RoleGuard Component
 *
 * Protects routes by checking user role against allowed roles.
 * Redirects to specified path or shows fallback if user doesn't have required role.
 *
 * @example
 * ```tsx
 * // Only allow admin and moderator (agent, verifier)
 * <RoleGuard allowedRoles={['admin', 'moderator']} redirectPath="/">
 *   <DashboardPage />
 * </RoleGuard>
 *
 * // Allow admin/moderator OR specifically allow OWNER backend role
 * <RoleGuard
 *   allowedRoles={['admin', 'moderator']}
 *   allowedBackendRoles={['OWNER']}
 *   redirectPath="/"
 * >
 *   <ManagedListingsPage />
 * </RoleGuard>
 *
 * // Show custom fallback
 * <RoleGuard
 *   allowedRoles={['admin']}
 *   fallback={<AccessDenied />}
 * >
 *   <AdminPanel />
 * </RoleGuard>
 * ```
 */
export function RoleGuard({
  children,
  allowedRoles,
  allowedBackendRoles,
  fallback = null,
  redirectPath,
}: RoleGuardProps) {
  const { data: session, status } = useAuthSession();
  const router = useRouter();

  const userRole = session?.user?.role;
  const hasPermission = userRole
    ? allowedRoles.some((role) => hasRole(userRole, role))
    : false;
  const isLoading = status === 'loading';
  const isUnauthenticated = status !== 'loading' && !session?.user;
  const shouldRedirect = !isLoading && (isUnauthenticated || !hasPermission) && !!redirectPath;

  useEffect(() => {
    if (shouldRedirect) {
      router.push(redirectPath!);
    }
  }, [shouldRedirect, redirectPath, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100' />
      </div>
    );
  }

  // No session or no permission
  if (isUnauthenticated || !hasPermission) {
  // No session - should be protected by auth middleware
  if (!session?.user) {
    if (redirectPath) {
      router.push(redirectPath);
      return null;
    }
    return <>{fallback}</>;
  }

  const userRole = session.user.role;
  const backendRoles = session.user.backendRoles || [];

  // Check if user has any of the allowed roles (frontend role hierarchy)
  const hasPermission = allowedRoles.some((role) => hasRole(userRole, role));

  // Check if user has any of the allowed backend roles (direct backend role check)
  const hasBackendPermission = allowedBackendRoles?.some((role) =>
    backendRoles.includes(role)
  );

  if (!hasPermission && !hasBackendPermission) {
    // Redirect or show fallback
    if (redirectPath) {
      // Show spinner while redirect is happening via useEffect
      return (
        <div className='flex min-h-screen items-center justify-center'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-900 dark:border-slate-700 dark:border-t-slate-100' />
        </div>
      );
    }
    return <>{fallback}</>;
  }

  // User has required role
  return <>{children}</>;
}
