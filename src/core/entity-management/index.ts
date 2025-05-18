/**
 * Entity Management Feature
 * -----------------------
 * A modular system for managing entities with CRUD operations, forms, tables, and more.
 */

// Export main components
export { EntityManager } from './components/EntityManager';

// Export context system
export { 
  EntityManagerProvider,
  useEntityManager,
} from './context';

// Export hooks
export {
  useEntityModal,
  useEntitySync,
  useEntityPermissions,
} from './hooks';

// Export store functions
export {
  createEntityStore,
  type EntityStore,
} from './store';

// Export types
export * from './types';

// Export components for advanced usage
export {
  // Organisms
  EntityTable,
  EntityFormSheet,
  EntityFormDialog,
  // Templates
  EntityManagerLayout,
  // Atoms and Molecules
  EntityNoAccess,
  EntityActionBar,
  EntityFormControls,
  // Data Table and Forms (re-exported)
  EntityDataTable,
  EntityForm,

} from './components';

// Export services, utils and validation
export * from './services';
export * from './utils';
export * from './validation';
