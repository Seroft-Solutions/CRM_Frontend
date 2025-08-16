'use client'

import { useRealtime } from '@/core/realtime/realtime-provider'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface PresenceIndicatorProps {
  roomId?: string
  showCurrentUser?: boolean
  maxVisible?: number
  position?: 'top-right' | 'bottom-left' | 'floating'
  className?: string
}

export function PresenceIndicator({ 
  roomId, 
  showCurrentUser = false, 
  maxVisible = 5,
  position = 'top-right',
  className 
}: PresenceIndicatorProps) {
  const { presence } = useRealtime()

  const filteredUsers = presence.users.filter(user => 
    showCurrentUser || user.id !== presence.currentUser.id
  )

  const visibleUsers = filteredUsers.slice(0, maxVisible)
  const hiddenCount = Math.max(0, filteredUsers.length - maxVisible)

  if (filteredUsers.length === 0) {
    return null
  }

  const positionClasses = {
    'top-right': 'absolute top-4 right-4',
    'bottom-left': 'absolute bottom-4 left-4',
    'floating': 'fixed top-4 right-4 z-50',
  }

  return (
    <TooltipProvider>
      <div className={cn(
        'flex items-center space-x-2 bg-background/80 backdrop-blur-sm border rounded-lg p-2 shadow-lg',
        positionClasses[position],
        className
      )}>
        <div className="flex -space-x-2">
          {visibleUsers.map((user) => (
            <Tooltip key={user.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-xs">
                      {user.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background",
                    {
                      'bg-green-500': user.status === 'online',
                      'bg-yellow-500': user.status === 'away',
                      'bg-red-500': user.status === 'busy',
                    }
                  )} />
                  {user.isEditing && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-500 rounded-full border-2 border-background animate-pulse" />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-muted-foreground capitalize">{user.status}</div>
                  {user.isEditing && user.editingField && (
                    <div className="text-blue-600">Editing: {user.editingField}</div>
                  )}
                  {user.currentPage && (
                    <div className="text-muted-foreground text-xs">
                      Page: {user.currentPage}
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          {hiddenCount > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                  +{hiddenCount}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-sm">
                  {hiddenCount} more user{hiddenCount > 1 ? 's' : ''} online
                </div>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <Badge variant="secondary" className="text-xs">
          {presence.totalCount} online
        </Badge>
      </div>
    </TooltipProvider>
  )
}