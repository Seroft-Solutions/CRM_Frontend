import { BaseService } from '../base/base-service';
import { KEYCLOAK_SERVICE_CONFIG, KEYCLOAK_REALM } from './config';

export class KeycloakService extends BaseService {
  private realm: string;

  constructor(realm = KEYCLOAK_REALM) {
    super(KEYCLOAK_SERVICE_CONFIG);
    this.realm = realm;
  }

  // Override base URL to include admin path
  protected getAdminPath(): string {
    return `/admin/realms/${this.realm}`;
  }

  // Add Keycloak-specific methods here if needed
  // These will be in addition to the Orval-generated endpoints

  // Example: Get current realm info
  async getRealmInfo(): Promise<any> {
    return this.get(`${this.getAdminPath()}`);
  }

  // Example: Custom user search with better error handling
  async searchUsers(query: string, options?: { first?: number; max?: number }): Promise<any[]> {
    const params = {
      search: query,
      first: options?.first || 0,
      max: options?.max || 20,
    };
    return this.get(`${this.getAdminPath()}/users`, { params });
  }

  // Example: Bulk user operations
  async getUsersWithRoles(roleNames: string[]): Promise<any[]> {
    const users = await this.get(`${this.getAdminPath()}/users`);
    // Filter users by roles logic here
    return users;
  }
}

// Export singleton instance
export const keycloakService = new KeycloakService();
