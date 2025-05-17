/**
 * Auth hooks exports
 *
 * Single source of truth for auth hook exports.
 * These hooks now use the generated API clients directly.
 */

// Re-export the hooks from the AuthProvider
export { useAuth, useRBAC } from '../providers/AuthProvider';

// Export registration hook directly from generated API
export { useRegister } from '@/core';
