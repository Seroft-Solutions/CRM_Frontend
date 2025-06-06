/**
 * Multi-Service Orval Configuration for CRM API
 * 
 * Generates TypeScript clients for different services:
 * - Spring Backend API (CRM business logic)
 * - Keycloak Admin API (Authentication & user management)
 */
module.exports = {
  // Spring Backend API Configuration
  springService: {
    output: {
      mode: 'tags-split',
      namingConvention: 'PascalCase',
      fileExtension: '.gen.ts',
      workspace: 'src/core/api/generated/spring',
      target: './endpoints',
      schemas: './schemas',
      client: 'react-query',
      clean: true,
      mock: false,
      override: {
        mutator: {
          path: '../../services/spring-service/service-mutator.ts',
          name: 'springServiceMutator',
        },
        query: {
          useQuery: true,
          useInfinite: true,
          useInfiniteQueryParam: 'nextId',
          options: {
            staleTime: 10000,
          },
        },
      },
    },
    input: {
      target: './openapi/openapi.json',
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },

  // Keycloak Admin API Configuration  
  keycloakService: {
    output: {
      mode: 'tags-split',
      namingConvention: 'PascalCase', 
      fileExtension: '.gen.ts',
      workspace: 'src/core/api/generated/keycloak',
      target: './endpoints',
      schemas: './schemas',
      clean: true,
      mock: false,
      override: {
        mutator: {
          path: '../../services/keycloak-service/service-mutator.ts',
          name: 'keycloakServiceMutator',
        }
      },
    },
    input: {
      target: './openapi/keycloak_openapi.json',
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write',
    },
  },
};
