// Global event system for session management
type SessionEventType = 'session-expired' | 'session-invalid' | 'auth-error'

interface SessionEvent {
  type: SessionEventType
  message?: string
  statusCode?: number
}

class SessionEventEmitter {
  private listeners: { [key: string]: Array<(event: SessionEvent) => void> } = {}

  on(eventType: SessionEventType, callback: (event: SessionEvent) => void) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = []
    }
    this.listeners[eventType].push(callback)
  }

  off(eventType: SessionEventType, callback: (event: SessionEvent) => void) {
    if (!this.listeners[eventType]) return
    
    const index = this.listeners[eventType].indexOf(callback)
    if (index > -1) {
      this.listeners[eventType].splice(index, 1)
    }
  }

  emit(eventType: SessionEventType, event: Omit<SessionEvent, 'type'> = {}) {
    if (!this.listeners[eventType]) return

    const fullEvent: SessionEvent = { type: eventType, ...event }
    this.listeners[eventType].forEach(callback => {
      try {
        callback(fullEvent)
      } catch (error) {
        console.error('Error in session event listener:', error)
      }
    })
  }

  // Clear all listeners (useful for testing)
  clear() {
    this.listeners = {}
  }
}

// Global singleton instance
export const sessionEventEmitter = new SessionEventEmitter()

// Hook for components to listen to session events
export function useSessionEvents() {
  return {
    onSessionExpired: (callback: (event: SessionEvent) => void) => {
      sessionEventEmitter.on('session-expired', callback)
      return () => sessionEventEmitter.off('session-expired', callback)
    },
    onSessionInvalid: (callback: (event: SessionEvent) => void) => {
      sessionEventEmitter.on('session-invalid', callback)
      return () => sessionEventEmitter.off('session-invalid', callback)
    },
    onAuthError: (callback: (event: SessionEvent) => void) => {
      sessionEventEmitter.on('auth-error', callback)
      return () => sessionEventEmitter.off('auth-error', callback)
    },
    emitSessionExpired: (message?: string, statusCode?: number) => {
      sessionEventEmitter.emit('session-expired', { message, statusCode })
    },
    emitSessionInvalid: (message?: string, statusCode?: number) => {
      sessionEventEmitter.emit('session-invalid', { message, statusCode })
    },
    emitAuthError: (message?: string, statusCode?: number) => {
      sessionEventEmitter.emit('auth-error', { message, statusCode })
    }
  }
}
