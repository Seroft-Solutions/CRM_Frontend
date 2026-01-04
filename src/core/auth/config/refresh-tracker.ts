/**
 * Token Refresh State Tracker
 * Manages per-user refresh state to prevent concurrent refreshes
 */

import type { JWT } from 'next-auth/jwt';
import type { RefreshEntry } from './types';
import { MIN_REFRESH_INTERVAL } from './constants';

/**
 * Per-user refresh tracking using user ID as key
 * Prevents multiple simultaneous refresh attempts for the same user
 */
class RefreshTracker {
  private refreshMap = new Map<string, RefreshEntry>();

  /**
   * Check if a refresh is already in progress for a user
   */
  isRefreshInProgress(userId: string): boolean {
    const entry = this.refreshMap.get(userId);

    if (!entry) {
      return false;
    }

    const now = Date.now();
    const timeSinceRefresh = now - entry.timestamp;

    return timeSinceRefresh < MIN_REFRESH_INTERVAL;
  }

  /**
   * Get existing refresh promise for a user
   */
  getRefreshPromise(userId: string): Promise<JWT> | null {
    const entry = this.refreshMap.get(userId);

    return entry?.promise || null;
  }

  /**
   * Store a refresh promise for a user
   */
  setRefreshPromise(userId: string, promise: Promise<JWT>): void {
    this.refreshMap.set(userId, {
      promise,
      timestamp: Date.now(),
    });
  }

  /**
   * Remove refresh entry for a user
   */
  clearRefresh(userId: string): void {
    this.refreshMap.delete(userId);
  }

  /**
   * Get the number of active refresh operations
   */
  getActiveRefreshCount(): number {
    return this.refreshMap.size;
  }

  /**
   * Clear all refresh entries (useful for testing)
   */
  clearAll(): void {
    this.refreshMap.clear();
  }
}

// Singleton instance
export const refreshTracker = new RefreshTracker();
