/**
 * In-memory roles manager
 * Stores user roles in a Map to avoid overloading the session
 */

class RolesManager {
  private userRoles = new Map<string, string[]>();
  
  /**
   * Set roles for a user
   */
  setUserRoles(userId: string, roles: string[]): void {
    console.log('🔧 Setting roles in manager:', { userId, roles });
    this.userRoles.set(userId, roles);
    console.log('🔧 Manager state after set:', {
      totalUsers: this.userRoles.size,
      allUsers: Array.from(this.userRoles.keys())
    });
  }
  
  /**
   * Get roles for a user
   */
  getUserRoles(userId: string): string[] {
    const roles = this.userRoles.get(userId) || [];
    console.log('🔍 Getting roles from manager:', { 
      userId, 
      roles, 
      totalUsers: this.userRoles.size,
      allUsers: Array.from(this.userRoles.keys()),
      hasUser: this.userRoles.has(userId)
    });
    return roles;
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
    return requiredRoles.some(role => userRoles.includes(role));
  }
  
  /**
   * Check if user has all of the specified roles
   */
  hasAllRoles(userId: string, requiredRoles: string[]): boolean {
    const userRoles = this.getUserRoles(userId);
    return requiredRoles.every(role => userRoles.includes(role));
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
