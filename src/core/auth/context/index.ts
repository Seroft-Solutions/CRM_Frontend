/**
 * Auth context exports
 *
 * These hooks now come directly from the AuthProvider
 */

import { useAuth } from '../providers/AuthProvider';
import { useRBAC } from '../rbac/context/RBACContext';

// Re-export the hooks
export { useAuth, useRBAC };

// Create alias for useAuth for backward compatibility
export const useAuthContext = useAuth;
