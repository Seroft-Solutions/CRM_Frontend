/**
 * Orval configuration for CRM API
 *
 * Generates TypeScript clients from OpenAPI specification
 * Each API endpoint is generated in its own directory organized by tag
 */
module.exports = {
  crmApi: {
    output: {
      mode: 'tags-split', // Generate in separate directories for each API tag
      namingConvention: 'PascalCase',
      fileExtension: '.gen.ts',
      workspace: 'src/core/api/generated',
      target: './endpoints',
      schemas: './schemas',
      client: 'react-query',
      clean: true, // Clean the output directory before generation
      mock: false, // Disable mock generation
      override: {
        mutator: {
          path: '../client/fetch-client.ts',
          name: 'customFetch',
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
};
