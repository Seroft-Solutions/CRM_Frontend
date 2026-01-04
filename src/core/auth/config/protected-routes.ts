/**
 * Protected Routes Configuration
 * Defines which routes require authentication
 */

/**
 * List of protected route prefixes
 * Any route starting with these prefixes requires authentication
 */
export const PROTECTED_ROUTE_PREFIXES = [
  '/dashboard',
  '/areas',
  '/calls',
  '/parties',
  '/user-management',
  '/cities',
  '/districts',
  '/states',
  '/products',
  '/sources',
  '/priorities',
  '/call-types',
  '/sub-call-types',
  '/call-categories',
  '/call-statuses',
  '/call-remarks',
  '/channel-types',
  '/organizations',
] as const;

/**
 * Organization flow routes (also protected)
 */
export const ORGANIZATION_ROUTE_PREFIX = '/organization';

/**
 * Default redirect after login
 */
export const DEFAULT_LOGIN_REDIRECT = '/organization';

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = ['/', '/auth/error', '/auth/signin'] as const;

/**
 * Check if a pathname is protected
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Check if a pathname is the organization flow
 */
export function isOrganizationRoute(pathname: string): boolean {
  return pathname.startsWith(ORGANIZATION_ROUTE_PREFIX);
}

/**
 * Check if a pathname is public
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => pathname === route);
}

/**
 * Check if user should be redirected from root
 */
export function shouldRedirectFromRoot(pathname: string, isAuthenticated: boolean): boolean {
  return isAuthenticated && pathname === '/';
}
