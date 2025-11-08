/**
 * Token Storage Utilities
 * Client-side token storage and management
 */

export const tokenStorage = {
  saveToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  },

  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  },

  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
    }
  },

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

  clearAll: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');
    }
  },
};
