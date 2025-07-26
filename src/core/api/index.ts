// Export base service classes and types
export { BaseService, type BaseServiceConfig } from './services/base/base-service';
export * from './services/base/types';

// Export specific services
export { SpringService, springService } from './services/spring-service';
export { KeycloakService, keycloakService } from './services/keycloak-service';

// Export service mutators for Orval
export { springServiceMutator } from './services/spring-service/service-mutator';
export { keycloakServiceMutator } from './services/keycloak-service/service-mutator';

// Export React Query provider
export { QueryClientProvider } from './providers/QueryClientProvider';

// Import services for default export
import { springService } from "@/core/api/services/spring-service";
import { keycloakService } from "@/core/api/services/keycloak-service";

// Default export for convenience
export default {
  spring: springService,
  keycloak: keycloakService,
};
