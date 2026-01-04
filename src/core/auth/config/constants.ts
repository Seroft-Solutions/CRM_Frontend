/**
 * Authentication Configuration Constants
 */

/**
 * Token refresh buffer time in seconds
 * Tokens will be refreshed this many seconds before expiration
 */
export const REFRESH_BUFFER_SECONDS = 60;

/**
 * Minimum interval between refresh attempts for the same user (in milliseconds)
 * Prevents rapid concurrent refresh requests
 */
export const MIN_REFRESH_INTERVAL = 2000;

/**
 * Maximum number of retry attempts for token refresh
 */
export const MAX_REFRESH_ATTEMPTS = 3;

/**
 * Maximum token age in seconds (24 hours)
 * Tokens older than this cannot be refreshed
 */
export const MAX_TOKEN_AGE_SECONDS = 86400;

/**
 * Session maximum age in seconds (24 hours)
 */
export const SESSION_MAX_AGE = 24 * 60 * 60;

/**
 * Default token expiration time in seconds (1 hour)
 * Used when Keycloak doesn't provide expires_in
 */
export const DEFAULT_TOKEN_EXPIRY = 3600;
