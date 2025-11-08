export { BaseService, type BaseServiceConfig } from './services/base/base-service';
export * from './services/base/types';

export { SpringService, springService } from './services/spring-service';
export { KeycloakService, keycloakService } from './services/keycloak-service';

export { springServiceMutator } from './services/spring-service/service-mutator';
export { keycloakServiceMutator } from './services/keycloak-service/service-mutator';

export { QueryClientProvider } from './providers/QueryClientProvider';

import { springService } from '@/core/api/services/spring-service';
import { keycloakService } from '@/core/api/services/keycloak-service';

export default {
  spring: springService,
  keycloak: keycloakService,
};
