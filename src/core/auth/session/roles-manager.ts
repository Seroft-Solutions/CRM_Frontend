/**
 * In-memory roles manager
 * Stores user roles in a Map to avoid overloading the session
 */

import type { RoleManagerInterface } from '../types';

class RolesManager implements RoleManagerInterface {
  private userRoles = new Map<string, string[]>();

  /**
   * Set roles for a user
   */
  setUserRoles(userId: string, roles: string[]): void {
    this.userRoles.set(userId, roles);
  }

  /**
   * Get roles for a user
   */
  getUserRoles(userId: string): string[] {
    return this.userRoles.get(userId) || [];
  }

  /**
   * Check if user has a specific role or permission
   */
  hasRole(userId: string, roleOrPermission: string): boolean {
    const roles = this.getUserRoles(userId);
    return roles.includes(roleOrPermission);
  }

  /**
   * Check if user has access (checks both permissions and roles)
   */
  hasAccess(userId: string, requiredPermission: string): boolean {
    const userRoles = this.getUserRoles(userId);

    // Check direct permission/role match
    if (userRoles.includes(requiredPermission)) {
      return true;
    }

    // Add any additional permission mapping logic here if needed
    return false;
  }

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(userId: string, requiredRoles: string[]): boolean {
    const userRoles = this.getUserRoles(userId);
    return requiredRoles.some((role) => userRoles.includes(role));
  }

  /**
   * Check if user has all of the specified roles
   */
  hasAllRoles(userId: string, requiredRoles: string[]): boolean {
    const userRoles = this.getUserRoles(userId);
    return requiredRoles.every((role) => userRoles.includes(role));
  }

  /**
   * Clear roles for a user (on logout)
   */
  clearUserRoles(userId: string): void {
    this.userRoles.delete(userId);
  }

  /**
   * Clear all roles (useful for cleanup)
   */
  clearAllRoles(): void {
    this.userRoles.clear();
  }

  /**
   * Get all users with roles (for debugging)
   */
  getAllUsers(): string[] {
    return Array.from(this.userRoles.keys());
  }
}

// Export singleton instance
export const rolesManager = new RolesManager();
