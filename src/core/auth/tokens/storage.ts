/**
 * Token Storage Utilities
 * Client-side token storage and management
 */

export const tokenStorage = {
  // Save token to localStorage (persists across browser sessions)
  saveToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  },

  // Get token from localStorage
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  },

  // Remove token from localStorage
  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  },

  // Alternative: Use sessionStorage (cleared when tab closes)
  saveTokenSession: (token: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('access_token', token);
    }
  },

  getTokenSession: (): string | null => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('access_token');
    }
    return null;
  },

  removeTokenSession: () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('access_token');
    }
  },

  // Clear all tokens
  clearAll: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');
    }
  },
};
