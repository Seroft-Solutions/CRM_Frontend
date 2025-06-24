/**
 * Unified Keycloak Service Exports
 *
 * This module exports the unified Keycloak admin client service and all related utilities
 * for consistent usage throughout the application.
 */

// Main service exports
export { keycloakService, KeycloakService } from './index';
export { keycloakServiceMutator, KeycloakAdminOperations } from './service-mutator';
export {
  KEYCLOAK_SERVICE_CONFIG,
  KEYCLOAK_REALM,
  KEYCLOAK_ADMIN_CONFIG,
  KEYCLOAK_ENDPOINTS,
} from './config';

// Re-export commonly used generated types for convenience
export type {
  UserRepresentation,
  GroupRepresentation,
  RoleRepresentation,
  MemberRepresentation,
  OrganizationRepresentation,
  // Query parameter types
  GetAdminRealmsRealmUsersParams,
  GetAdminRealmsRealmGroupsParams,
  GetAdminRealmsRealmRolesParams,
  GetAdminRealmsRealmOrganizationsOrgIdMembersParams,
  // Request body types
  PostAdminRealmsRealmOrganizationsOrgIdMembersInviteUserBody,
} from '@/core/api/generated/keycloak';

// Utility type for admin operations
export interface KeycloakAdminClientConfig {
  realm: string;
  baseUrl: string;
  adminUsername: string;
  adminPassword: string;
  clientId: string;
  clientSecret?: string;
}

// Common error types for Keycloak operations
export interface KeycloakError {
  message: string;
  status: number;
  isKeycloakError: true;
  timestamp: string;
  context?: string;
}

// Permission check result type
export interface PermissionCheckResult {
  authorized: boolean;
  error?: string;
}
