/**
 * Spring Role Service
 * Manages user roles from Spring Database instead of Keycloak JWT tokens
 * Solves the 431 error issue when JWT tokens b    // Extract roles from Spring profile (roles field)
    if (profile.roles && Array.isArray(profile.roles)) {
      roles.push(...profile.roles.map(role => typeof role === 'string' ? role : role.name || '').filter(Boolean));
    }

    // Note: userRoles field doesn't exist in UserProfileDTO schema
    // The roles are stored in the 'roles' field aboverge due to 1000+ roles
 */

import { getUserProfile, getAllUserProfiles } from '../../../core/api/generated/spring';
import type { UserProfileDTO } from '../../../core/api/generated/spring/schemas';

export interface UserRoleData {
  userId: string;
  keycloakId: string;
  roles: string[];
  groups: string[];
  springProfile: UserProfileDTO;
  lastFetched: number;
}

export interface SpringRoleServiceInterface {
  fetchUserRoles(keycloakId: string): Promise<UserRoleData | null>;
  getUserRoles(keycloakId: string): Promise<string[]>;
  getUserGroups(keycloakId: string): Promise<string[]>;
  hasRole(keycloakId: string, role: string): Promise<boolean>;
  hasAnyRole(keycloakId: string, roles: string[]): Promise<boolean>;
  hasAllRoles(keycloakId: string, roles: string[]): Promise<boolean>;
  clearUserCache(keycloakId: string): void;
  clearAllCache(): void;
}

/**
 * Spring Role Service Class
 * Fetches and caches user roles from Spring Database
 */
class SpringRoleService implements SpringRoleServiceInterface {
  private roleCache = new Map<string, UserRoleData>();
  private readonly CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

  /**
   * Fetch user roles and groups from Spring Database
   */
  async fetchUserRoles(keycloakId: string): Promise<UserRoleData | null> {
    try {
      // Check cache first
      const cached = this.roleCache.get(keycloakId);
      if (cached && Date.now() - cached.lastFetched < this.CACHE_EXPIRY) {
        return cached;
      }

      // Fetch user profile from Spring
      const allProfiles = await getAllUserProfiles();
      const userProfile = allProfiles.find(profile => profile.keycloakId === keycloakId);

      if (!userProfile) {
        console.warn(`No Spring profile found for Keycloak ID: ${keycloakId}`);
        return null;
      }

      // Extract roles and groups from the profile
      const roles = this.extractRolesFromProfile(userProfile);
      const groups = this.extractGroupsFromProfile(userProfile);

      const userData: UserRoleData = {
        userId: userProfile.id?.toString() || '',
        keycloakId,
        roles,
        groups,
        springProfile: userProfile,
        lastFetched: Date.now(),
      };

      // Cache the result
      this.roleCache.set(keycloakId, userData);
      
      console.log(`✅ Fetched roles for user ${keycloakId}:`, { roles: roles.length, groups: groups.length });
      return userData;

    } catch (error) {
      console.error('Failed to fetch user roles from Spring:', error);
      return null;
    }
  }

  /**
   * Get user roles from Spring Database
   */
  async getUserRoles(keycloakId: string): Promise<string[]> {
    const userData = await this.fetchUserRoles(keycloakId);
    return userData?.roles || [];
  }

  /**
   * Get user groups from Spring Database
   */
  async getUserGroups(keycloakId: string): Promise<string[]> {
    const userData = await this.fetchUserRoles(keycloakId);
    return userData?.groups || [];
  }

  /**
   * Check if user has a specific role
   */
  async hasRole(keycloakId: string, role: string): Promise<boolean> {
    const roles = await this.getUserRoles(keycloakId);
    return roles.includes(role);
  }

  /**
   * Check if user has any of the specified roles
   */
  async hasAnyRole(keycloakId: string, roles: string[]): Promise<boolean> {
    const userRoles = await this.getUserRoles(keycloakId);
    return roles.some(role => userRoles.includes(role));
  }

  /**
   * Check if user has all of the specified roles
   */
  async hasAllRoles(keycloakId: string, roles: string[]): Promise<boolean> {
    const userRoles = await this.getUserRoles(keycloakId);
    return roles.every(role => userRoles.includes(role));
  }

  /**
   * Clear user cache - call this after role/group changes
   */
  clearUserCache(keycloakId: string): void {
    const deleted = this.roleCache.delete(keycloakId);
    if (deleted) {
      console.log(`🗑️ Invalidated role cache for user: ${keycloakId}`);
    }
  }

  /**
   * Clear all cached role data
   */
  clearAllCache(): void {
    const size = this.roleCache.size;
    this.roleCache.clear();
    console.log(`🗑️ Cleared all role cache (${size} entries)`);
  }

  /**
   * Extract roles from Spring user profile
   * This method needs to be updated based on your Spring UserProfileDTO structure
   */
  private extractRolesFromProfile(profile: UserProfileDTO): string[] {
    const roles: string[] = [];

    // Add roles from profile.roles if it exists
    if (profile.roles && Array.isArray(profile.roles)) {
      roles.push(...profile.roles.map(role => typeof role === 'string' ? role : role.name || '').filter(Boolean));
    }

    // Remove duplicates and return
    return Array.from(new Set(roles));
  }

  /**
   * Extract groups from Spring user profile
   * This method needs to be updated based on your Spring UserProfileDTO structure
   */
  private extractGroupsFromProfile(profile: UserProfileDTO): string[] {
    const groups: string[] = [];

    // Extract groups from Spring profile (groups field)
    if (profile.groups && Array.isArray(profile.groups)) {
      groups.push(...profile.groups.map(group => typeof group === 'string' ? group : group.name || '').filter(Boolean));
    }

    // Note: userGroups field doesn't exist in UserProfileDTO schema
    // The groups are stored in the 'groups' field above

    // Remove duplicates and return
    return Array.from(new Set(groups));
  }

  /**
   * Refresh user data from Spring (force fetch)
   */
  async refreshUserRoles(keycloakId: string): Promise<UserRoleData | null> {
    this.clearUserCache(keycloakId);
    return this.fetchUserRoles(keycloakId);
  }

  /**
   * Get cached user data without fetching
   */
  getCachedUserData(keycloakId: string): UserRoleData | null {
    const cached = this.roleCache.get(keycloakId);
    if (cached && Date.now() - cached.lastFetched < this.CACHE_EXPIRY) {
      return cached;
    }
    return null;
  }

  /**
   * Check if user data is cached and valid
   */
  isUserDataCached(keycloakId: string): boolean {
    return this.getCachedUserData(keycloakId) !== null;
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { size: number; entries: Array<{ keycloakId: string; lastFetched: number; age: number }> } {
    const now = Date.now();
    const entries = Array.from(this.roleCache.entries()).map(([keycloakId, data]) => ({
      keycloakId,
      lastFetched: data.lastFetched,
      age: now - data.lastFetched,
    }));

    return {
      size: this.roleCache.size,
      entries,
    };
  }
}

// Export singleton instance
export const springRoleService = new SpringRoleService();
