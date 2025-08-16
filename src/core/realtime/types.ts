export interface RealtimeMessage {
  id: string
  type: MessageType
  event: string
  data: any
  timestamp: number
  userId: string
  organizationId: string
  room?: string
}

export type MessageType = 'data_update' | 'presence_update' | 'notification' | 'conflict' | 'system'

export interface EventCallback {
  (message: RealtimeMessage): void
}

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting' | 'error'

export interface WebSocketManagerConfig {
  url: string
  reconnectInterval: number
  maxReconnectAttempts: number
  heartbeatInterval: number
}

export interface PresenceUser {
  id: string
  name: string
  avatar?: string
  status: 'online' | 'away' | 'busy'
  lastSeen: Date
  currentPage?: string
  isEditing?: boolean
  editingField?: string
}

export interface PresenceState {
  users: PresenceUser[]
  currentUser: PresenceUser
  totalCount: number
}

export interface ActivityEvent {
  id: string
  type: ActivityType
  entityType: string
  entityId: string
  userId: string
  userName: string
  action: string
  changes?: FieldChange[]
  timestamp: Date
  metadata?: Record<string, any>
}

export type ActivityType = 'create' | 'update' | 'delete' | 'view' | 'comment'

export interface FieldChange {
  field: string
  oldValue: any
  newValue: any
}

export interface ConflictData<T> {
  id: string
  entityType: string
  entityId: string
  localVersion: T
  remoteVersion: T
  conflictedFields: string[]
  timestamp: Date
  resolvedBy?: string
  resolution?: 'local' | 'remote' | 'merged'
}