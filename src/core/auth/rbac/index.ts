/**
 * RBAC functionality exports
 *
 * RBAC (Role-Based Access Control) functionality is now
 * integrated directly into the AuthProvider.
 */

// Re-export the RBAC hook from the AuthProvider
export { useRBAC } from '../providers/AuthProvider';

// Re-export the RBAC context type
export type { RBACContextValue } from '../providers/AuthProvider';
