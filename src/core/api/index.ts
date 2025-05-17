/**
 * API module exports
 *
 * Central export point for all API-related functionality.
 */

// Re-export utility functions
export * from './client/fetch-client';
export * from './client/axios-client';

// Re-export setup functions
export * from './setup';

// Export providers
export * from './providers';

// Export generated API clients
export * from './generated';
