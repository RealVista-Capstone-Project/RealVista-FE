/**
 * Role-Based Access Control (RBAC) utilities
 *
 * Implements role hierarchy: user < moderator < admin
 */

export type UserRole = 'user' | 'moderator' | 'admin';

/**
 * Role hierarchy for access control
 * Higher number = higher privilege level
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 1,
  moderator: 2,
  admin: 3,
};

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
export function hasRole(
  userRole: string | undefined,
  requiredRole: UserRole
): boolean {
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
