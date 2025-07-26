import { BaseService } from '../base/base-service';
import { SPRING_SERVICE_CONFIG } from './config';

export class SpringService extends BaseService {
  constructor() {
    super(SPRING_SERVICE_CONFIG);
  }

  // Add Spring-specific methods here if needed
  // These will be in addition to the Orval-generated endpoints

  // Example: Custom health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/actuator/health');
  }

  // Example: Custom tenant-aware request
  async getTenantInfo(tenantId: string): Promise<any> {
    return this.get(`/tenant/${tenantId}/info`);
  }
}

// Export singleton instance
export const springService = new SpringService();
