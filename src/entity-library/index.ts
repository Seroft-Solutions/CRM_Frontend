/**
 * Entity Library (Public API)
 *
 * Keep this barrel intentionally small and stable.
 * Internal hooks, utilities, and micro-components should be imported
 * via their module paths from within the entity-library itself.
 */

// Configuration system (types, validation, helpers)
export * from './config';

// Action creators
export { createEntityActions } from './actions';

// Primary page-level component
export { EntityTablePage } from './components/EntityTablePage';

// Core shared types
export * from './types';
