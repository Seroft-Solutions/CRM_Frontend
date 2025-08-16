import { EventCallback, RealtimeMessage, ConnectionStatus, WebSocketManagerConfig } from './types'

export class WebSocketManager {
  private socket: WebSocket | null = null
  private config: WebSocketManagerConfig
  private eventCallbacks: Map<string, Set<EventCallback>> = new Map()
  private messageQueue: RealtimeMessage[] = []
  private connectionStatus: ConnectionStatus = 'disconnected'
  private reconnectAttempts = 0
  private heartbeatInterval: NodeJS.Timeout | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null

  constructor(config: WebSocketManagerConfig) {
    this.config = config
  }

  async connect(): Promise<void> {
    if (this.socket?.readyState === WebSocket.OPEN) {
      return
    }

    this.setConnectionStatus('connecting')

    try {
      this.socket = new WebSocket(this.config.url)
      this.setupEventHandlers()
      
      await new Promise<void>((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('WebSocket not initialized'))
          return
        }

        this.socket.onopen = () => {
          this.setConnectionStatus('connected')
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.flushMessageQueue()
          resolve()
        }

        this.socket.onerror = (error) => {
          this.setConnectionStatus('error')
          reject(error)
        }
      })
    } catch (error) {
      this.setConnectionStatus('error')
      this.handleReconnect()
      throw error
    }
  }

  disconnect(): void {
    this.setConnectionStatus('disconnected')
    this.stopHeartbeat()
    this.clearReconnectTimeout()
    
    if (this.socket) {
      this.socket.close()
      this.socket = null
    }
  }

  subscribe(event: string, callback: EventCallback): void {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, new Set())
    }
    this.eventCallbacks.get(event)!.add(callback)
  }

  unsubscribe(event: string, callback: EventCallback): void {
    const callbacks = this.eventCallbacks.get(event)
    if (callbacks) {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.eventCallbacks.delete(event)
      }
    }
  }

  send(message: RealtimeMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message))
    } else {
      // Queue message for later sending
      this.messageQueue.push(message)
    }
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus
  }

  private setupEventHandlers(): void {
    if (!this.socket) return

    this.socket.onmessage = (event) => {
      try {
        const message: RealtimeMessage = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error)
      }
    }

    this.socket.onclose = () => {
      this.setConnectionStatus('disconnected')
      this.stopHeartbeat()
      this.handleReconnect()
    }

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error)
      this.setConnectionStatus('error')
    }
  }

  private handleMessage(message: RealtimeMessage): void {
    // Handle heartbeat/pong messages
    if (message.type === 'system' && message.event === 'pong') {
      return
    }

    // Emit to all subscribers of this event
    const callbacks = this.eventCallbacks.get(message.event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(message)
        } catch (error) {
          console.error('Error in message callback:', error)
        }
      })
    }

    // Emit to all subscribers of the message type
    const typeCallbacks = this.eventCallbacks.get(message.type)
    if (typeCallbacks) {
      typeCallbacks.forEach(callback => {
        try {
          callback(message)
        } catch (error) {
          console.error('Error in type callback:', error)
        }
      })
    }
  }

  private setConnectionStatus(status: ConnectionStatus): void {
    this.connectionStatus = status
    this.emit('connection_status', { status })
  }

  private emit(event: string, data: any): void {
    const callbacks = this.eventCallbacks.get(event)
    if (callbacks) {
      const message: RealtimeMessage = {
        id: crypto.randomUUID(),
        type: 'system',
        event,
        data,
        timestamp: Date.now(),
        userId: '',
        organizationId: '',
      }
      callbacks.forEach(callback => {
        try {
          callback(message)
        } catch (error) {
          console.error('Error in event callback:', error)
        }
      })
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached')
      return
    }

    this.setConnectionStatus('reconnecting')
    this.reconnectAttempts++

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    
    this.reconnectTimeout = setTimeout(async () => {
      try {
        await this.connect()
      } catch (error) {
        console.error('Reconnection failed:', error)
      }
    }, delay)
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.socket?.readyState === WebSocket.OPEN) {
        const heartbeat: RealtimeMessage = {
          id: crypto.randomUUID(),
          type: 'system',
          event: 'ping',
          data: {},
          timestamp: Date.now(),
          userId: '',
          organizationId: '',
        }
        this.send(heartbeat)
      }
    }, this.config.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message) {
        this.send(message)
      }
    }
  }
}