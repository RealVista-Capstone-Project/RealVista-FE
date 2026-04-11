/**
 * Role-Based Access Control (RBAC) utilities
 *
 * Maps backend roles (ADMIN, AGENT, VERIFIER, BUYER, OWNER, TENANT)
 * to frontend role hierarchy for access control.
 *
 * Role hierarchy:
 * - ADMIN -> admin (level 4)
 * - AGENT, VERIFIER -> moderator (level 3)
 * - OWNER -> owner (level 2)
 * - BUYER, TENANT -> user (level 1)
 */

export type BackendRole = 'ADMIN' | 'AGENT' | 'VERIFIER' | 'BUYER' | 'OWNER' | 'TENANT';
export type UserRole = 'user' | 'owner' | 'moderator' | 'admin';

/**
 * Map backend roles from authentication response to frontend roles
 */
export const BACKEND_ROLE_MAP: Record<BackendRole, UserRole> = {
  ADMIN: 'admin',
  AGENT: 'moderator',
  VERIFIER: 'moderator',
  BUYER: 'user',
  OWNER: 'owner',
  TENANT: 'user',
};

/**
 * Role hierarchy for access control
 * Higher number = higher privilege level
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  owner: 2,
  moderator: 3,
  admin: 4,
};

/**
 * Map a backend role to frontend role
 *
 * @param backendRole - Role from authentication response (ADMIN, BUYER, etc)
 * @returns Frontend role (admin, moderator, user) or undefined
 *
 * @example
 * ```ts
 * mapBackendRole('ADMIN') // 'admin'
 * mapBackendRole('BUYER') // 'user'
 * mapBackendRole('OWNER') // 'owner'
 * mapBackendRole('AGENT') // 'moderator'
 * mapBackendRole(undefined) // undefined
 * ```
 */
export function mapBackendRole(backendRole: string | undefined): UserRole | undefined {
  if (!backendRole) return undefined;

  // Validate that the role is a known backend role
  if (!(backendRole in BACKEND_ROLE_MAP)) {
    console.warn(`[RBAC] Unknown backend role: ${backendRole}`);
    return undefined;
  }

  return BACKEND_ROLE_MAP[backendRole as BackendRole];
}

/**
 * Determine primary user role from multiple backend roles
 *
 * Priority logic:
 * 1. If user has OWNER → 'owner' (manage-agent layout)
 * 2. If user has ANY of [BUYER, TENANT] → 'user' (public layout)
 * 3. Else if user has ADMIN → 'admin' (dashboard layout)
 * 4. Else if user has [AGENT, VERIFIER] → 'moderator' (dashboard layout)
 * 5. Else → 'user' (fallback)
 *
 * @param backendRoles - Array of roles from authentication response
 * @returns Primary frontend role for routing
 *
 * @example
 * ```ts
 * determineUserRole(['BUYER', 'TENANT']) // 'user'
 * determineUserRole(['OWNER']) // 'owner'
 * determineUserRole(['ADMIN']) // 'admin'
 * determineUserRole(['AGENT']) // 'moderator'
 * determineUserRole([]) // 'user'
 * ```
 */
export function determineUserRole(backendRoles: string[] | undefined): UserRole {
  if (!backendRoles || backendRoles.length === 0) {
    return 'user'; // Default fallback
  }

  // Owner role - gets dedicated manage-agent layout
  if (backendRoles.includes('OWNER')) {
    return 'owner';
  }

  // Public roles - if user has ANY of these, they use public layout
  const publicRoles: BackendRole[] = ['BUYER', 'TENANT'];
  const hasPublicRole = backendRoles.some((role) => publicRoles.includes(role as BackendRole));

  if (hasPublicRole) {
    return 'user';
  }

  // Dashboard roles - admin has highest priority
  if (backendRoles.includes('ADMIN')) {
    return 'admin';
  }

  // Dashboard roles - moderator level
  if (backendRoles.includes('AGENT') || backendRoles.includes('VERIFIER')) {
    return 'moderator';
  }

  // Default fallback
  return 'user';
}

/**
 * Check if user has required role based on hierarchy
 *
 * @param userRole - The user's current role
 * @param requiredRole - The minimum required role
 * @returns true if user has sufficient permissions
 *
 * @example
 * ```ts
 * hasRole('moderator', 'user') // true (moderator >= user)
 * hasRole('user', 'admin') // false (user < admin)
 * hasRole(undefined, 'user') // false (no role)
 * ```
 */
export function hasRole(userRole: string | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;

  // Ensure userRole is valid
  if (!(userRole in ROLE_HIERARCHY)) return false;

  const userLevel = ROLE_HIERARCHY[userRole as UserRole];
  const requiredLevel = ROLE_HIERARCHY[requiredRole];

  return userLevel >= requiredLevel;
}

/**
 * Check if user can access a route based on role requirements
 *
 * @param userRole - The user's current role
 * @param requiredRole - The minimum required role (undefined = no role required)
 * @returns true if user can access the route
 */
export function canAccessRoute(
  userRole: string | undefined,
  requiredRole: UserRole | undefined
): boolean {
  if (!requiredRole) return true; // No role requirement
  return hasRole(userRole, requiredRole);
}

/**
 * Get the default redirect path after login based on user role
 *
 * @param role - The user's frontend role
 * @returns The path to redirect to after login
 *
 * @example
 * ```ts
 * getRedirectPathByRole('user') // '/buy'
 * getRedirectPathByRole('owner') // '/manage-agent'
 * getRedirectPathByRole('admin') // '/dashboard'
 * getRedirectPathByRole('moderator') // '/dashboard'
 * ```
 */
// TODO: Handle only BackendRole
export function getRedirectPathByRole(role: UserRole | undefined): string {
  switch (role) {
    case 'owner':
      return '/manage-agent';
    case 'admin':
    case 'moderator':
      return '/dashboard/owner-properties';
    case 'user':
    default:
      return '/buy';
  }
}
