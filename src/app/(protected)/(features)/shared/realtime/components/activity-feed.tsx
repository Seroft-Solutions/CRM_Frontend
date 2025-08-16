'use client'

import { useState, useEffect } from 'react'
import { useRealtime } from '@/core/realtime/realtime-provider'
import { ActivityEvent } from '@/core/realtime/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Filter, RefreshCw } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface ActivityFeedProps {
  feedType: 'user' | 'customer' | 'global'
  entityId?: string
  maxItems?: number
  filters?: ActivityFilter[]
  className?: string
}

interface ActivityFilter {
  type: 'action' | 'user' | 'entityType'
  value: string
  label: string
}

export function ActivityFeed({
  feedType,
  entityId,
  maxItems = 50,
  filters = [],
  className
}: ActivityFeedProps) {
  const { subscribe, unsubscribe } = useRealtime()
  const [activities, setActivities] = useState<ActivityEvent[]>([])
  const [filteredActivities, setFilteredActivities] = useState<ActivityEvent[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(false)

  // Subscribe to activity events
  useEffect(() => {
    const handleActivity = (message: any) => {
      const activity: ActivityEvent = {
        id: message.id || crypto.randomUUID(),
        type: message.data.type,
        entityType: message.data.entityType,
        entityId: message.data.entityId,
        userId: message.data.userId,
        userName: message.data.userName,
        action: message.data.action,
        changes: message.data.changes,
        timestamp: new Date(message.timestamp),
        metadata: message.data.metadata,
      }

      // Filter based on feed type
      let shouldInclude = true
      if (feedType === 'customer' && entityId) {
        shouldInclude = activity.entityType === 'customer' && activity.entityId === entityId
      } else if (feedType === 'user' && entityId) {
        shouldInclude = activity.userId === entityId
      }

      if (shouldInclude) {
        setActivities(prev => [activity, ...prev.slice(0, maxItems - 1)])
      }
    }

    subscribe('activity', handleActivity)
    subscribe('user_activity', handleActivity)
    subscribe('entity_activity', handleActivity)

    return () => {
      unsubscribe('activity', handleActivity)
      unsubscribe('user_activity', handleActivity)
      unsubscribe('entity_activity', handleActivity)
    }
  }, [subscribe, unsubscribe, feedType, entityId, maxItems])

  // Filter activities based on search and filters
  useEffect(() => {
    let filtered = activities

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(activity =>
        activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.entityType.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply selected filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(activity => {
        switch (selectedFilter) {
          case 'create':
            return activity.type === 'create'
          case 'update':
            return activity.type === 'update'
          case 'delete':
            return activity.type === 'delete'
          case 'view':
            return activity.type === 'view'
          default:
            return true
        }
      })
    }

    setFilteredActivities(filtered)
  }, [activities, searchTerm, selectedFilter])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'create':
        return '✨'
      case 'update':
        return '✏️'
      case 'delete':
        return '🗑️'
      case 'view':
        return '👁️'
      case 'comment':
        return '💬'
      default:
        return '📝'
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'create':
        return 'text-green-600'
      case 'update':
        return 'text-blue-600'
      case 'delete':
        return 'text-red-600'
      case 'view':
        return 'text-gray-600'
      case 'comment':
        return 'text-purple-600'
      default:
        return 'text-gray-600'
    }
  }

  const refresh = () => {
    setIsLoading(true)
    // In a real implementation, this would fetch fresh data
    setTimeout(() => setIsLoading(false), 1000)
  }

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">
            Activity Feed
            {feedType === 'customer' && ' - Customer'}
            {feedType === 'user' && ' - User'}
            {feedType === 'global' && ' - All Activity'}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={refresh} disabled={isLoading}>
            <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search activities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-32">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="create">Created</SelectItem>
              <SelectItem value="update">Updated</SelectItem>
              <SelectItem value="delete">Deleted</SelectItem>
              <SelectItem value="view">Viewed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {filteredActivities.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {activities.length === 0 ? 'No activity yet' : 'No matching activities'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredActivities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 p-3 hover:bg-muted/50 transition-colors border-b last:border-b-0"
                >
                  {/* User Avatar */}
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className="text-xs">
                      {activity.userName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getActivityIcon(activity.type)}</span>
                      <p className="text-sm">
                        <span className="font-medium">{activity.userName}</span>
                        <span className={cn('ml-1', getActivityColor(activity.type))}>
                          {activity.action}
                        </span>
                        <span className="text-muted-foreground ml-1">
                          {activity.entityType}
                        </span>
                      </p>
                    </div>

                    {/* Changes Details */}
                    {activity.changes && activity.changes.length > 0 && (
                      <div className="mt-1 space-y-1">
                        {activity.changes.slice(0, 3).map((change, changeIndex) => (
                          <div key={changeIndex} className="text-xs text-muted-foreground">
                            <span className="font-medium">{change.field}:</span>
                            <span className="line-through ml-1">{String(change.oldValue)}</span>
                            <span className="mx-1">→</span>
                            <span className="text-green-600">{String(change.newValue)}</span>
                          </div>
                        ))}
                        {activity.changes.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{activity.changes.length - 3} more changes
                          </div>
                        )}
                      </div>
                    )}

                    {/* Timestamp */}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}