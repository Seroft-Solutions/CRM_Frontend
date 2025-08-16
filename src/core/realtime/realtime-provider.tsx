'use client'

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { WebSocketManager } from './websocket-manager'
import { RealtimeMessage, ConnectionStatus, PresenceState, EventCallback } from './types'

interface RealtimeContextValue {
  isConnected: boolean
  connectionStatus: ConnectionStatus
  presence: PresenceState
  subscribe: (event: string, handler: EventCallback) => void
  unsubscribe: (event: string, handler: EventCallback) => void
  emit: (event: string, data: any) => void
  joinRoom: (roomId: string) => void
  leaveRoom: (roomId: string) => void
  updatePresence: (updates: Partial<PresenceState['currentUser']>) => void
}

interface RealtimeProviderProps {
  children: ReactNode
  websocketUrl?: string
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null)

export function RealtimeProvider({ children, websocketUrl = 'ws://localhost:8080/ws' }: RealtimeProviderProps) {
  const { data: session } = useSession()
  const wsManager = useRef<WebSocketManager | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected')
  const [presence, setPresence] = useState<PresenceState>({
    users: [],
    currentUser: {
      id: '',
      name: '',
      status: 'online',
      lastSeen: new Date(),
    },
    totalCount: 0,
  })
  const currentRooms = useRef<Set<string>>(new Set())

  // Initialize WebSocket manager
  useEffect(() => {
    if (!session?.user) return

    wsManager.current = new WebSocketManager({
      url: websocketUrl,
      reconnectInterval: 1000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
    })

    // Subscribe to connection status changes
    wsManager.current.subscribe('connection_status', (message) => {
      setConnectionStatus(message.data.status)
    })

    // Subscribe to presence updates
    wsManager.current.subscribe('presence_update', (message) => {
      setPresence(prevPresence => ({
        ...prevPresence,
        ...message.data,
      }))
    })

    // Connect
    wsManager.current.connect().catch(console.error)

    // Update current user presence
    setPresence(prev => ({
      ...prev,
      currentUser: {
        id: session.user.id || '',
        name: session.user.name || '',
        avatar: session.user.image || undefined,
        status: 'online',
        lastSeen: new Date(),
      },
    }))

    return () => {
      wsManager.current?.disconnect()
    }
  }, [session, websocketUrl])

  // Send initial presence when connected
  useEffect(() => {
    if (connectionStatus === 'connected' && session?.user) {
      emit('presence_join', {
        user: {
          id: session.user.id,
          name: session.user.name,
          avatar: session.user.image,
          status: 'online',
          lastSeen: new Date(),
          currentPage: window.location.pathname,
        },
      })
    }
  }, [connectionStatus, session])

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updatePresence({ status: 'away' })
      } else {
        updatePresence({ status: 'online' })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const subscribe = (event: string, handler: EventCallback) => {
    wsManager.current?.subscribe(event, handler)
  }

  const unsubscribe = (event: string, handler: EventCallback) => {
    wsManager.current?.unsubscribe(event, handler)
  }

  const emit = (event: string, data: any) => {
    if (!session?.user || !wsManager.current) return

    const message: RealtimeMessage = {
      id: crypto.randomUUID(),
      type: 'data_update',
      event,
      data,
      timestamp: Date.now(),
      userId: session.user.id || '',
      organizationId: session.organization?.id || '',
    }

    wsManager.current.send(message)
  }

  const joinRoom = (roomId: string) => {
    if (!currentRooms.current.has(roomId)) {
      currentRooms.current.add(roomId)
      emit('join_room', { roomId })
    }
  }

  const leaveRoom = (roomId: string) => {
    if (currentRooms.current.has(roomId)) {
      currentRooms.current.delete(roomId)
      emit('leave_room', { roomId })
    }
  }

  const updatePresence = (updates: Partial<PresenceState['currentUser']>) => {
    const updatedUser = { ...presence.currentUser, ...updates, lastSeen: new Date() }
    
    setPresence(prev => ({
      ...prev,
      currentUser: updatedUser,
    }))

    emit('presence_update', { user: updatedUser })
  }

  const value: RealtimeContextValue = {
    isConnected: connectionStatus === 'connected',
    connectionStatus,
    presence,
    subscribe,
    unsubscribe,
    emit,
    joinRoom,
    leaveRoom,
    updatePresence,
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}

export function useRealtime() {
  const context = useContext(RealtimeContext)
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}

export { RealtimeContext }