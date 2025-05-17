/**
 * EventBus
 *
 * A global event bus that allows different modules to communicate
 * through events without direct dependencies.
 *
 * This follows the Mediator pattern and enables loose coupling
 * between modules while maintaining separation of concerns.
 */

type EventListener<T = any> = (data: T) => void;

interface EventBusBase {
  on<T>(event: string, listener: EventListener<T>): () => void;
  off<T>(event: string, listener: EventListener<T>): void;
  emit<T>(event: string, data: T): void;
  once<T>(event: string, listener: EventListener<T>): () => void;
}

class EventBus implements EventBusBase {
  private events: Map<string, Set<EventListener>> = new Map();

  /**
   * Subscribe to an event with a listener
   *
   * @param event - Event name
   * @param listener - Listener function
   * @returns Unsubscribe function
   */
  on<T>(event: string, listener: EventListener<T>): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }

    this.events.get(event)!.add(listener);

    // Return unsubscribe function
    return () => this.off(event, listener);
  }

  /**
   * Unsubscribe from an event
   *
   * @param event - Event name
   * @param listener - Listener function
   */
  off<T>(event: string, listener: EventListener<T>): void {
    if (this.events.has(event)) {
      this.events.get(event)!.delete(listener);

      // Clean up empty event sets
      if (this.events.get(event)!.size === 0) {
        this.events.delete(event);
      }
    }
  }

  /**
   * Emit an event with data
   *
   * @param event - Event name
   * @param data - Event data
   */
  emit<T>(event: string, data: T): void {
    if (this.events.has(event)) {
      this.events.get(event)!.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in event listener for "${event}":`, error);
        }
      });
    }
  }

  /**
   * Subscribe to an event for one-time execution
   *
   * @param event - Event name
   * @param listener - Listener function
   * @returns Unsubscribe function
   */
  once<T>(event: string, listener: EventListener<T>): () => void {
    const wrappedListener = (data: T) => {
      // Remove listener after first execution
      this.off(event, wrappedListener);
      // Execute original listener
      listener(data);
    };

    // Return unsubscribe function
    return this.on(event, wrappedListener);
  }
}

// Create and export a singleton instance
export const eventBus = new EventBus();

// Export event name constants for type safety
export const EventNames = {
  AUTH: {
    TOKEN_EXPIRED: 'auth:token_expired',
    UNAUTHORIZED: 'auth:unauthorized',
    LOGOUT: 'auth:logout',
    LOGIN_SUCCESS: 'auth:login_success',
    LOGIN_FAILURE: 'auth:login_failure',
  },
  API: {
    ERROR: 'api:error',
    REQUEST_START: 'api:request_start',
    REQUEST_END: 'api:request_end',
  },
};

// Also export the EventBus class for type usage
export type { EventBusBase, EventListener };
export default eventBus;
