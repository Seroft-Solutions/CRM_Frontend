import { BaseService } from '@/core/api/services/base/base-service';
import { SPRING_SERVICE_CONFIG } from '@/core/api/services/spring-service/config';

export class SpringService extends BaseService {
  constructor() {
    super(SPRING_SERVICE_CONFIG);
  }

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/actuator/health');
  }

  async getTenantInfo(tenantId: string): Promise<any> {
    return this.get(`/tenant/${tenantId}/info`);
  }
}

export const springService = new SpringService();
