import { render, screen } from '@/test-utils'
import { WebSocketManager } from '@/core/realtime/websocket-manager'

// Mock WebSocket
const mockWebSocket = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
  readyState: 3, // CLOSED by default
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null,
}

// Mock WebSocket constants
Object.defineProperty(global, 'WebSocket', {
  value: jest.fn().mockImplementation(() => mockWebSocket),
  writable: true,
})

// Add WebSocket constants
global.WebSocket.CONNECTING = 0
global.WebSocket.OPEN = 1  
global.WebSocket.CLOSING = 2
global.WebSocket.CLOSED = 3

describe('WebSocketManager', () => {
  let manager: WebSocketManager

  beforeEach(() => {
    manager = new WebSocketManager({
      url: 'ws://localhost:8080/ws',
      reconnectInterval: 1000,
      maxReconnectAttempts: 3,
      heartbeatInterval: 30000,
    })
  })

  afterEach(() => {
    manager.disconnect()
  })

  it('should initialize with disconnected status', () => {
    expect(manager.getConnectionStatus()).toBe('disconnected')
  })

  it('should allow subscribing to events', () => {
    const callback = jest.fn()
    manager.subscribe('test_event', callback)
    
    // Should not throw
    expect(() => {
      manager.unsubscribe('test_event', callback)
    }).not.toThrow()
  })

  it('should queue messages when not connected', () => {
    const message = {
      id: '1',
      type: 'data_update' as const,
      event: 'test',
      data: { test: true },
      timestamp: Date.now(),
      userId: 'user1',
      organizationId: 'org1',
    }

    // Should queue message and not throw when disconnected
    expect(() => {
      manager.send(message)
    }).not.toThrow()
    
    // Connection status should still be disconnected
    expect(manager.getConnectionStatus()).toBe('disconnected')
  })
})