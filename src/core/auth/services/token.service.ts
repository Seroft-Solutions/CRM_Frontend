/**
 * Token service
 *
 * Manages authentication tokens (storage, retrieval, clearing).
 */

export interface TokenServiceConfig {
  tokenKey?: string;
  refreshTokenKey?: string;
  storage?: Storage;
}

export interface TokenService {
  getToken: () => string | null;
  setToken: (token: string) => void;
  getRefreshToken: () => string | null;
  setRefreshToken: (refreshToken: string) => void;
  clearTokens: () => void;
}

/**
 * Create a token service
 *
 * Factory function that creates a token service with the provided configuration.
 */
export function createTokenService(config: TokenServiceConfig = {}): TokenService {
  const tokenKey = config.tokenKey || 'auth_token';
  const refreshTokenKey = config.refreshTokenKey || 'refresh_token';

  // Use provided storage or fallback to localStorage or a memory store if not available
  let storage: Storage;

  if (config.storage) {
    storage = config.storage;
  } else if (typeof window !== 'undefined' && window.localStorage) {
    // Make sure we're on the client side before using localStorage
    storage = window.localStorage;
  } else {
    // Memory storage fallback for environments without localStorage
    const memoryStore: Record<string, string> = {};
    storage = {
      getItem: (key: string) => memoryStore[key] || null,
      setItem: (key: string, value: string) => {
        memoryStore[key] = value;
      },
      removeItem: (key: string) => {
        delete memoryStore[key];
      },
      clear: () => {
        Object.keys(memoryStore).forEach(key => delete memoryStore[key]);
      },
      key: (index: number) => Object.keys(memoryStore)[index] || null,
      length: 0,
    };
  }

  return {
    /**
     * Get the stored authentication token
     */
    getToken: () => {
      return storage.getItem(tokenKey);
    },

    /**
     * Store an authentication token
     */
    setToken: (token: string) => {
      storage.setItem(tokenKey, token);
    },

    /**
     * Get the stored refresh token
     */
    getRefreshToken: () => {
      return storage.getItem(refreshTokenKey);
    },

    /**
     * Store a refresh token
     */
    setRefreshToken: (refreshToken: string) => {
      storage.setItem(refreshTokenKey, refreshToken);
    },

    /**
     * Clear all authentication tokens
     */
    clearTokens: () => {
      storage.removeItem(tokenKey);
      storage.removeItem(refreshTokenKey);
    },
  };
}
