// Example: Using in a component
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { tokenStorage } from '@/lib/token-storage'

export function useTokenStorage() {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.access_token) {
      // Save to localStorage (persists across sessions)
      tokenStorage.saveToken(session.access_token)
      
      // OR save to sessionStorage (cleared when tab closes)
      // tokenStorage.saveTokenSession(session.access_token)
    }
  }, [session?.access_token])

  return {
    token: tokenStorage.getToken(),
    clearToken: tokenStorage.removeToken
  }
}
