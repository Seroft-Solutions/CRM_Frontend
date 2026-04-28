/**
 * Token Cache Implementation
 * In-memory token caching with automatic refresh
 */

export class TokenCache {
  private token: string | null = null;
  private expiry = 0;
  private refreshPromise: Promise<string | null> | null = null;
  private readonly refreshBufferMs = 30 * 1000;

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
        this.expiry = this.getUsableTokenExpiry(newToken);
      }
      return newToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      this.token = null;
      this.expiry = 0;
      return null;
    }
  }

  private getUsableTokenExpiry(token: string): number {
    const fallbackExpiry = Date.now() + 60 * 1000;

    try {
      const [, payload] = token.split('.');
      if (!payload) {
        return fallbackExpiry;
      }

      const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
      const paddedPayload = normalizedPayload.padEnd(
        normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
        '='
      );
      const decodedPayload = JSON.parse(atob(paddedPayload));
      const expiryMs = Number(decodedPayload.exp) * 1000;

      if (!Number.isFinite(expiryMs)) {
        return fallbackExpiry;
      }

      return Math.max(Date.now(), expiryMs - this.refreshBufferMs);
    } catch (error) {
      console.warn('Unable to parse access token expiry; using short token cache window', error);
      return fallbackExpiry;
    }
  }
}

export const tokenCache = new TokenCache();
