/**
 * Example components showing optimized session usage with organization support
 */

'use client'

import { useOptimizedSession, useUser, useUserRoles, useUserOrganizations } from '@/providers/session-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { OrganizationSwitcher, OrganizationBadge } from '@/components/organization/organization-switcher'
import { useState, useTransition } from 'react'
import { protectedAction, adminOnlyAction } from '@/app/actions/auth'

/**
 * Enhanced User Profile Component - shows user info with organizations
 */
export function EnhancedUserProfile() {
  const { user, isAuthenticated, isLoading } = useUser()
  const { roles, hasRole } = useUserRoles()
  const { organizations, currentOrganization } = useUserOrganizations()

  if (isLoading) {
    return <div>Loading user profile...</div>
  }

  if (!isAuthenticated) {
    return <div>Please sign in to view your profile.</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          User Profile
          <OrganizationBadge />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <strong>Name:</strong> {user?.name}
        </div>
        <div>
          <strong>Email:</strong> {user?.email}
        </div>
        
        {/* Current Organization */}
        {currentOrganization && (
          <div>
            <strong>Current Organization:</strong>
            <div className="mt-2 p-3 bg-muted rounded-lg">
              <div className="font-medium">{currentOrganization.name}</div>
              <div className="text-sm text-muted-foreground">ID: {currentOrganization.id}</div>
            </div>
          </div>
        )}
        
        {/* All Organizations */}
        {organizations.length > 0 && (
          <div>
            <strong>Organizations ({organizations.length}):</strong>
            <div className="flex flex-wrap gap-2 mt-2">
              {organizations.map((org) => (
                <Badge key={org.id} variant="outline">
                  {org.name}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Roles */}
        <div>
          <strong>Roles:</strong>
          <div className="flex flex-wrap gap-2 mt-2">
            {roles.map((role) => (
              <Badge key={role} variant="secondary">
                {role}
              </Badge>
            ))}
          </div>
        </div>
        
        <div>
          <strong>Admin Access:</strong> {hasRole('ROLE_ADMIN') ? 'Yes' : 'No'}
        </div>
        
        {/* Organization Switcher */}
        {organizations.length > 1 && (
          <div>
            <strong>Switch Organization:</strong>
            <div className="mt-2">
              <OrganizationSwitcher />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Organization Dashboard Component
 */
export function OrganizationDashboard() {
  const { currentOrganization, organizations } = useUserOrganizations()
  const { hasRole } = useUserRoles()

  if (!currentOrganization) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Organization Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No organization selected. Please contact your administrator.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Organization Dashboard
            <OrganizationSwitcher variant="ghost" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">{currentOrganization.name}</h3>
              <p className="text-sm text-muted-foreground">
                Organization ID: {currentOrganization.id}
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="text-2xl font-bold">42</div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold">128</div>
                <div className="text-sm text-muted-foreground">Active Projects</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold">$12.5K</div>
                <div className="text-sm text-muted-foreground">Monthly Revenue</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold">98.5%</div>
                <div className="text-sm text-muted-foreground">Uptime</div>
              </Card>
            </div>
            
            {hasRole('ROLE_ADMIN') && (
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Admin Actions</h4>
                <div className="flex gap-2">
                  <Button size="sm">Manage Users</Button>
                  <Button size="sm" variant="outline">View Reports</Button>
                  <Button size="sm" variant="outline">Settings</Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Session Debug Component - shows full session state including organizations
 */
export function SessionDebugWithOrganizations() {
  const { session, status, isLoading } = useOptimizedSession()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Debug (With Organizations)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div><strong>Status:</strong> {status}</div>
          <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
          <div><strong>Organizations Count:</strong> {session?.user?.organizations?.length || 0}</div>
          <div><strong>Current Org:</strong> {session?.user?.currentOrganization?.name || 'None'}</div>
          <div><strong>Session Data:</strong></div>
          <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-64">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}
