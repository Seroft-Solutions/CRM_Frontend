'use client'

import { useEffect, useCallback, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRealtime } from '@/core/realtime/realtime-provider'
import { RealtimeMessage } from '@/core/realtime/types'

interface UseLiveDataOptions<T> {
  key: string
  initialData?: T
  onUpdate?: (data: T) => void
  onConflict?: (local: T, remote: T) => T
  entityType?: string
  entityId?: string
}

export function useLiveData<T>({
  key,
  initialData,
  onUpdate,
  onConflict,
  entityType,
  entityId,
}: UseLiveDataOptions<T>) {
  const { subscribe, unsubscribe, emit, joinRoom, leaveRoom } = useRealtime()
  const queryClient = useQueryClient()
  const conflictResolver = useRef(onConflict)

  // Update conflict resolver reference
  conflictResolver.current = onConflict

  // Join room for entity-specific updates
  useEffect(() => {
    if (entityType && entityId) {
      const roomId = `${entityType}:${entityId}`
      joinRoom(roomId)
      return () => leaveRoom(roomId)
    }
  }, [entityType, entityId, joinRoom, leaveRoom])

  // Handle real-time data updates
  const handleDataUpdate = useCallback((message: RealtimeMessage) => {
    const { data: remoteData, entityType: msgEntityType, entityId: msgEntityId } = message.data

    // Filter updates for specific entity if specified
    if (entityType && entityId) {
      if (msgEntityType !== entityType || msgEntityId !== entityId) {
        return
      }
    }

    // Get current local data
    const localData = queryClient.getQueryData<T>([key])

    if (localData && conflictResolver.current) {
      // Handle potential conflicts
      const resolvedData = conflictResolver.current(localData, remoteData)
      queryClient.setQueryData([key], resolvedData)
      onUpdate?.(resolvedData)
    } else {
      // No conflict resolution needed, use remote data
      queryClient.setQueryData([key], remoteData)
      onUpdate?.(remoteData)
    }
  }, [key, entityType, entityId, queryClient, onUpdate])

  // Handle entity deletion
  const handleEntityDelete = useCallback((message: RealtimeMessage) => {
    const { entityType: msgEntityType, entityId: msgEntityId } = message.data

    if (entityType && entityId && msgEntityType === entityType && msgEntityId === entityId) {
      queryClient.invalidateQueries({ queryKey: [key] })
    }
  }, [key, entityType, entityId, queryClient])

  // Subscribe to relevant events
  useEffect(() => {
    const updateEvent = entityType ? `${entityType}_updated` : `${key}_updated`
    const deleteEvent = entityType ? `${entityType}_deleted` : `${key}_deleted`

    subscribe(updateEvent, handleDataUpdate)
    subscribe(deleteEvent, handleEntityDelete)

    return () => {
      unsubscribe(updateEvent, handleDataUpdate)
      unsubscribe(deleteEvent, handleEntityDelete)
    }
  }, [key, entityType, subscribe, unsubscribe, handleDataUpdate, handleEntityDelete])

  // Optimistic update function
  const optimisticUpdate = useCallback((updateFn: (current: T | undefined) => T) => {
    const currentData = queryClient.getQueryData<T>([key])
    const newData = updateFn(currentData)
    
    // Apply optimistic update locally
    queryClient.setQueryData([key], newData)
    
    // Broadcast the change
    const eventName = entityType ? `${entityType}_updated` : `${key}_updated`
    emit(eventName, {
      data: newData,
      entityType,
      entityId,
      isOptimistic: true,
    })

    return newData
  }, [key, entityType, entityId, queryClient, emit])

  // Rollback function for failed optimistic updates
  const rollback = useCallback((previousData: T) => {
    queryClient.setQueryData([key], previousData)
  }, [key, queryClient])

  // Sync function to manually refresh data
  const sync = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: [key] })
  }, [key, queryClient])

  return {
    optimisticUpdate,
    rollback,
    sync,
  }
}