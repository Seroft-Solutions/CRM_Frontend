/**
 * Entity Library Configuration
 * 
 * All configuration types, validation, and helpers
 */

// Table config types (columns, pagination, sorting, etc.)
export * from './types';

// Zod schemas for validation
export * from './schemas';

// Entity configuration types and utilities
export {
  // Simple config for basic table functionality
  type EntityConfig,
  // Comprehensive config with all features
  type EntityLibraryConfig,
  type ConfigValidationResult,
  type StatusEnum,
  type StatusTab,
  validateEntityLibraryConfig,
  createEntityLibraryConfig,
} from './entity-library-config';

// Configuration helpers
export { createDefaultEntityLibraryConfig } from './helpers';
