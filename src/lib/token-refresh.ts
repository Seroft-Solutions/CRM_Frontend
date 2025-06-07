// Keycloak token refresh utility
export interface TokenRefreshResult {
  success: boolean
  accessToken?: string
  refreshToken?: string
  expiresIn?: number
  error?: string
}

export async function refreshKeycloakToken(refreshToken: string): Promise<TokenRefreshResult> {
  try {
    const tokenUrl = `${process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER}/protocol/openid-connect/token`
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID!,
        client_secret: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_SECRET!,
        refresh_token: refreshToken,
      }),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Token refresh failed:', response.status, errorData)
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorData}`
      }
    }

    const data = await response.json()
    
    return {
      success: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in
    }
  } catch (error) {
    console.error('Token refresh error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Client-side session refresh
export async function refreshSession(): Promise<boolean> {
  try {
    // Get current session
    const sessionResponse = await fetch('/api/auth/session')
    if (!sessionResponse.ok) return false
    
    const currentSession = await sessionResponse.json()
    if (!currentSession?.access_token) return false

    // Extract refresh token from current session
    const tokenPayload = JSON.parse(atob(currentSession.access_token.split('.')[1]))
    const refreshToken = currentSession.refresh_token || tokenPayload.refresh_token

    if (!refreshToken) {
      console.error('No refresh token available')
      return false
    }

    // Refresh the token
    const refreshResult = await refreshKeycloakToken(refreshToken)
    
    if (!refreshResult.success) {
      console.error('Token refresh failed:', refreshResult.error)
      return false
    }

    // Update session with new tokens via NextAuth
    const { update } = await import('next-auth/react')
    await update({
      ...currentSession,
      access_token: refreshResult.accessToken,
      refresh_token: refreshResult.refreshToken
    })

    // Clear API service token cache
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('token-refreshed', {
        detail: { accessToken: refreshResult.accessToken }
      }))
    }

    return true
  } catch (error) {
    console.error('Session refresh failed:', error)
    return false
  }
}
