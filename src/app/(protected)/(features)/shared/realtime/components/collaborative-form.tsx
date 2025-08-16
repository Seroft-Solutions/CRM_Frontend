'use client'

import { useState, useEffect, useRef } from 'react'
import { useRealtime } from '@/core/realtime/realtime-provider'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface CollaborativeFormProps {
  formId: string
  entityType: string
  entityId: string
  children: React.ReactNode
  onConflict?: (local: any, remote: any) => any
}

interface FieldEditor {
  userId: string
  userName: string
  fieldName: string
  timestamp: Date
}

export function CollaborativeForm({
  formId,
  entityType,
  entityId,
  children,
  onConflict
}: CollaborativeFormProps) {
  const { subscribe, unsubscribe, emit, joinRoom, leaveRoom } = useRealtime()
  const [activeEditors, setActiveEditors] = useState<FieldEditor[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const roomId = `form:${formId}`
    joinRoom(roomId)

    // Subscribe to form editing events
    const handleFieldEdit = (message: any) => {
      const { userId, userName, fieldName, action } = message.data
      
      if (action === 'start_edit') {
        setActiveEditors(prev => [
          ...prev.filter(editor => !(editor.userId === userId && editor.fieldName === fieldName)),
          { userId, userName, fieldName, timestamp: new Date() }
        ])
      } else if (action === 'stop_edit') {
        setActiveEditors(prev => 
          prev.filter(editor => !(editor.userId === userId && editor.fieldName === fieldName))
        )
      }
    }

    const handleFormChange = (message: any) => {
      const { fieldName, value, userId } = message.data
      // Handle real-time form changes
      console.log(`Field ${fieldName} changed by ${userId}:`, value)
    }

    subscribe('form_field_edit', handleFieldEdit)
    subscribe('form_change', handleFormChange)

    return () => {
      leaveRoom(roomId)
      unsubscribe('form_field_edit', handleFieldEdit)
      unsubscribe('form_change', handleFormChange)
    }
  }, [formId, subscribe, unsubscribe, joinRoom, leaveRoom])

  const startEditing = (fieldName: string) => {
    setIsEditing(true)
    emit('form_field_edit', {
      formId,
      entityType,
      entityId,
      fieldName,
      action: 'start_edit'
    })
  }

  const stopEditing = (fieldName: string) => {
    setIsEditing(false)
    emit('form_field_edit', {
      formId,
      entityType,
      entityId,
      fieldName,
      action: 'stop_edit'
    })
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    emit('form_change', {
      formId,
      entityType,
      entityId,
      fieldName,
      value
    })
  }

  const getFieldEditors = (fieldName: string) => {
    return activeEditors.filter(editor => editor.fieldName === fieldName)
  }

  const hasActiveEditors = activeEditors.length > 0

  return (
    <div ref={formRef} className="relative">
      {/* Active Editors Indicator */}
      {hasActiveEditors && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-blue-800">
            <span className="font-medium">Active Editors:</span>
            <div className="flex -space-x-1">
              {Array.from(new Set(activeEditors.map(e => e.userId))).map(userId => {
                const editor = activeEditors.find(e => e.userId === userId)
                return (
                  <Avatar key={userId} className="h-6 w-6 border-2 border-white">
                    <AvatarFallback className="text-xs">
                      {editor?.userName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Enhanced form children with editing indicators */}
      <div className="space-y-4">
        {typeof children === 'object' && children !== null && 'props' in children
          ? enhanceFormElements(children, {
              activeEditors,
              onFieldFocus: startEditing,
              onFieldBlur: stopEditing,
              onFieldChange: handleFieldChange,
            })
          : children}
      </div>

      {/* Typing Indicators */}
      {activeEditors.map(editor => (
        <div
          key={`${editor.userId}-${editor.fieldName}`}
          className="absolute top-0 right-0 pointer-events-none"
        >
          <Badge 
            variant="secondary" 
            className="text-xs bg-blue-100 text-blue-800 animate-pulse"
          >
            {editor.userName} editing {editor.fieldName}
          </Badge>
        </div>
      ))}
    </div>
  )
}

// Helper function to enhance form elements with collaboration features
function enhanceFormElements(
  children: any,
  handlers: {
    activeEditors: FieldEditor[]
    onFieldFocus: (fieldName: string) => void
    onFieldBlur: (fieldName: string) => void
    onFieldChange: (fieldName: string, value: any) => void
  }
): React.ReactNode {
  // This is a simplified version - in a real implementation,
  // you would recursively traverse the React element tree
  // and enhance input elements with the collaboration features
  return children
}