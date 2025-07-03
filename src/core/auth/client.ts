/**
 * Client-Side Authentication Exports
 * Contains React hooks and components that require 'use client'
 * Now uses consolidated Spring-based implementation
 */

'use client';

// Client-side hooks - specific exports to avoid circular dependencies
export { useUserRoles, usePermission, useAnyPermission, useAllRoles } from './hooks/use-spring-roles';
export { useActivityTracker } from './hooks/use-activity-tracker';
export { useSessionMonitor } from './hooks/use-session-monitor';
export { useIdleTimeout } from './hooks/use-idle-timeout';

// Client-side components - specific exports to avoid circular dependencies
export { PermissionGuard, InlinePermissionGuard } from './components/permission-guard';
export { SessionExpiredModal } from './components/session-expired-modal';
export { SessionStatus } from './components/session-status';
export { UnauthorizedPage } from './components/unauthorized-page';

// Client-side providers
export { AppSessionProvider } from './providers/session-provider';
