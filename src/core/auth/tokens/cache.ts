/**
 * Token Cache Implementation
 * In-memory token caching with automatic refresh
 */

export class TokenCache {
  private token: string | null = null;
  private expiry = 0;
  private refreshPromise: Promise<string | null> | null = null;

  async getToken(refreshFn: () => Promise<string | null>): Promise<string | null> {
    const now = Date.now();
    if (this.token && now < this.expiry) {
      return this.token;
    }
    if (this.refreshPromise) {
      return this.refreshPromise;
    }
    this.refreshPromise = this.refreshToken(refreshFn);
    const newToken = await this.refreshPromise;
    this.refreshPromise = null;
    return newToken;
  }

  invalidate() {
    this.token = null;
    this.expiry = 0;
    this.refreshPromise = null;
  }

  private async refreshToken(refreshFn: () => Promise<string | null>): Promise<string | null> {
    try {
      const newToken = await refreshFn();
      if (newToken) {
        this.token = newToken;
        this.expiry = Date.now() + 5 * 60 * 1000;
      }
      return newToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.token = null;
      this.expiry = 0;
      return null;
    }
  }
}

export const tokenCache = new TokenCache();
