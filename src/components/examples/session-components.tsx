/**
 * Example components showing optimized session usage
 */

'use client'

import { useOptimizedSession, useUser, useUserRoles } from '@/providers/session-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useState, useTransition } from 'react'
import { protectedAction, adminOnlyAction } from '@/app/actions/auth'

/**
 * User Profile Component - uses optimized session hooks
 */
export function UserProfile() {
  const { user, isAuthenticated, isLoading } = useUser()
  const { roles, hasRole } = useUserRoles()

  if (isLoading) {
    return <div>Loading user profile...</div>
  }

  if (!isAuthenticated) {
    return <div>Please sign in to view your profile.</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <strong>Name:</strong> {user?.name}
        </div>
        <div>
          <strong>Email:</strong> {user?.email}
        </div>
        <div>
          <strong>Roles:</strong>
          <div className="flex gap-2 mt-2">
            {roles.map((role) => (
              <Badge key={role} variant="secondary">
                {role}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <strong>Admin Access:</strong> {hasRole('admin') ? 'Yes' : 'No'}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Protected Action Component - demonstrates server action usage
 */
export function ProtectedActions() {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<string>('')
  const { hasRole } = useUserRoles()

  const handleProtectedAction = () => {
    startTransition(async () => {
      try {
        const response = await protectedAction({ data: 'test' })
        setResult(`Protected action success: ${JSON.stringify(response)}`)
      } catch (error) {
        setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    })
  }

  const handleAdminAction = () => {
    startTransition(async () => {
      try {
        const response = await adminOnlyAction({ data: 'admin-test' })
        setResult(`Admin action success: ${JSON.stringify(response)}`)
      } catch (error) {
        setResult(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Protected Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={handleProtectedAction} 
            disabled={isPending}
          >
            Test Protected Action
          </Button>
          
          <Button 
            onClick={handleAdminAction} 
            disabled={isPending || !hasRole('admin')}
            variant={hasRole('admin') ? 'default' : 'secondary'}
          >
            Test Admin Action
          </Button>
        </div>
        
        {result && (
          <div className="p-3 bg-muted rounded-md">
            <pre className="text-sm">{result}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Session Debug Component - shows session state
 */
export function SessionDebug() {
  const { session, status, isLoading } = useOptimizedSession()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Session Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div><strong>Status:</strong> {status}</div>
          <div><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</div>
          <div><strong>Session Data:</strong></div>
          <pre className="bg-muted p-2 rounded text-xs overflow-auto">
            {JSON.stringify(session, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}
