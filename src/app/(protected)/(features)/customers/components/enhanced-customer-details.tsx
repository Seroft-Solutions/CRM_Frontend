'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerDetails } from '@/app/(protected)/(features)/customers/components/customer-details'
import { ActivityFeed } from '@/app/(protected)/(features)/shared/realtime/components/activity-feed'
import { useLiveData } from '@/app/(protected)/(features)/shared/realtime/hooks/use-live-data'
import { useRealtime } from '@/core/realtime/realtime-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Users, Activity, Clock } from 'lucide-react'

interface EnhancedCustomerDetailsProps {
  id: number
}

export function EnhancedCustomerDetails({ id }: EnhancedCustomerDetailsProps) {
  const router = useRouter()
  const { joinRoom, leaveRoom, presence, updatePresence } = useRealtime()

  // Join customer-specific room for real-time updates
  useEffect(() => {
    const roomId = `customer:${id}`
    joinRoom(roomId)
    
    // Update presence to indicate current page
    updatePresence({ 
      currentPage: `/customers/${id}`,
      isEditing: false 
    })

    return () => {
      leaveRoom(roomId)
    }
  }, [id, joinRoom, leaveRoom, updatePresence])

  // Set up live data synchronization for customer
  const { optimisticUpdate, rollback, sync } = useLiveData({
    key: `customer-${id}`,
    entityType: 'customer',
    entityId: id.toString(),
    onUpdate: (data) => {
      console.log('Customer data updated:', data)
      // Handle real-time updates
    },
    onConflict: (local, remote) => {
      // Simple conflict resolution - prefer remote for now
      // In a real app, this would show the conflict resolution modal
      console.warn('Customer data conflict detected', { local, remote })
      return remote
    }
  })

  // Count active users viewing this customer
  const activeViewers = presence.users.filter(user => 
    user.currentPage === `/customers/${id}`
  ).length

  return (
    <div className="space-y-6">
      {/* Active Viewers Indicator */}
      {activeViewers > 1 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="flex items-center gap-2 pt-4">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-800">
              {activeViewers - 1} other user{activeViewers > 2 ? 's' : ''} viewing this customer
            </span>
            <Badge variant="outline" className="text-blue-600 border-blue-300">
              Live
            </Badge>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customer Details
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Activity Feed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-0">
          <CustomerDetails id={id} />
        </TabsContent>

        <TabsContent value="activity" className="space-y-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Activity Feed */}
            <div className="lg:col-span-2">
              <ActivityFeed 
                feedType="customer"
                entityId={id.toString()}
                maxItems={100}
                className="h-[600px]"
              />
            </div>

            {/* Side Panel - Quick Stats */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
                  <CardDescription>Real-time customer metrics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Active Viewers</span>
                    <Badge variant="secondary">{activeViewers}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                    <span className="text-sm flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Live
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Recent Changes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Real-time change tracking active
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}