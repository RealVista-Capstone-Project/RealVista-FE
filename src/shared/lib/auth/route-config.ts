/**
 * Route protection configuration with exact path matching
 *
 * Design principles:
 * - Use exact path matching (not startsWith) to avoid false positives
 * - Organize by access level for clarity
 * - Support future extensibility (dynamic routes, wildcards)
 */

export interface RouteConfig {
  /** Exact path without locale prefix */
  path: string;
  /** Access level required */
  accessLevel: 'public' | 'protected' | 'moderator' | 'admin';
  /** Optional: role required for access */
  requiredRole?: 'user' | 'moderator' | 'admin';
}

export const routeConfig: RouteConfig[] = [
  // Public routes
  { path: '/', accessLevel: 'public' },
  { path: '/home', accessLevel: 'public' },
  { path: '/about', accessLevel: 'public' },
  { path: '/login', accessLevel: 'public' },
  { path: '/register', accessLevel: 'public' },
  { path: '/forgot-password', accessLevel: 'public' },
  { path: '/reset-password', accessLevel: 'public' },

  // Protected routes (require authentication)
  { path: '/dashboard', accessLevel: 'protected', requiredRole: 'user' },
  { path: '/settings', accessLevel: 'protected', requiredRole: 'user' },
  { path: '/profile', accessLevel: 'protected', requiredRole: 'user' },

  // Moderator routes (require moderator or admin)
  { path: '/moderation', accessLevel: 'moderator', requiredRole: 'moderator' },

  // Admin routes (require admin role)
  { path: '/admin', accessLevel: 'admin', requiredRole: 'admin' },
];

/**
 * Check if a pathname (without locale) matches a route exactly
 */
export function matchesRoute(pathnameWithoutLocale: string, routePath: string): boolean {
  return pathnameWithoutLocale === routePath;
}

/**
 * Get route configuration for a given pathname (without locale)
 */
export function getRouteConfig(pathnameWithoutLocale: string): RouteConfig | undefined {
  return routeConfig.find((route) => matchesRoute(pathnameWithoutLocale, route.path));
}

/**
 * Check if a route is public (no auth required)
 */
export function isPublicRoute(pathnameWithoutLocale: string): boolean {
  const config = getRouteConfig(pathnameWithoutLocale);
  return config?.accessLevel === 'public';
}

/**
 * Get required role for a route
 */
export function getRequiredRole(
  pathnameWithoutLocale: string
): 'user' | 'moderator' | 'admin' | undefined {
  const config = getRouteConfig(pathnameWithoutLocale);
  return config?.requiredRole;
}
