import { BaseService } from "@/core/api/services/base/base-service";
import { SPRING_SERVICE_CONFIG } from "@/core/api/services/spring-service/config";

export class SpringService extends BaseService {
  constructor() {
    super(SPRING_SERVICE_CONFIG);
  }

  // Add custom Spring-specific methods here if needed
  // These will be in addition to the Orval-generated endpoints
}

// Export singleton instance
export const springService = new SpringService();
