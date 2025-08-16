// Realtime components exports
export { PresenceIndicator } from './components/presence-indicator'
export { NotificationCenter } from './components/notification-center'
export { ConflictResolutionModal } from './components/conflict-resolution-modal'
export { ActivityFeed } from './components/activity-feed'
export { CollaborativeForm } from './components/collaborative-form'

// Realtime hooks exports
export { useLiveData } from './hooks/use-live-data'

// Core realtime exports
export { RealtimeProvider, useRealtime } from '@/core/realtime/realtime-provider'
export { WebSocketManager } from '@/core/realtime/websocket-manager'
export type { 
  RealtimeMessage, 
  ConnectionStatus, 
  PresenceState, 
  ActivityEvent, 
  ConflictData 
} from '@/core/realtime/types'