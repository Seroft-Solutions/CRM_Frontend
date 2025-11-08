/**
 * Unified Keycloak Service Exports
 *
 * This module exports the unified Keycloak admin client service and all related utilities
 * for consistent usage throughout the application.
 */

export { keycloakService, KeycloakService } from './index';
export { keycloakServiceMutator, KeycloakAdminOperations } from './service-mutator';
export {
  KEYCLOAK_SERVICE_CONFIG,
  KEYCLOAK_REALM,
  KEYCLOAK_ADMIN_CONFIG,
  KEYCLOAK_ENDPOINTS,
} from './config';

export type {
  UserRepresentation,
  GroupRepresentation,
  RoleRepresentation,
  MemberRepresentation,
  OrganizationRepresentation,
  GetAdminRealmsRealmUsersParams,
  GetAdminRealmsRealmGroupsParams,
  GetAdminRealmsRealmRolesParams,
  GetAdminRealmsRealmOrganizationsOrgIdMembersParams,
  PostAdminRealmsRealmOrganizationsOrgIdMembersInviteUserBody,
} from '@/core/api/generated/keycloak';

export interface KeycloakAdminClientConfig {
  realm: string;
  baseUrl: string;
  adminUsername: string;
  adminPassword: string;
  clientId: string;
  clientSecret?: string;
}

export interface KeycloakError {
  message: string;
  status: number;
  isKeycloakError: true;
  timestamp: string;
  context?: string;
}

export interface PermissionCheckResult {
  authorized: boolean;
  error?: string;
}
