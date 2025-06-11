import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"
import { rolesManager } from "@/components/auth/roles-manager"

console.log('🔧 AUTH.TS: Initializing NextAuth configuration')

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      organizations?: Array<{ name: string; id: string }>
      roles?: string[]
    }
    access_token?: string
    refresh_token?: string
  }
  
  interface JWT {
    id_token?: string
    access_token?: string
    refresh_token?: string
    expires_at?: number
    error?: string
    organizations?: Array<{ name: string; id: string }>
    roles?: string[]
  }
}

interface KeycloakTokenPayload {
  sub: string
  organizations?: Record<string, { id: string }>
  realm_access?: { roles?: string[] }
  resource_access?: Record<string, { roles?: string[] }>
  [key: string]: any
}

function parseOrganizations(accessToken: string): Array<{ name: string; id: string }> {
  console.log('🏢 AUTH: Starting organization parsing from access token')
  try {
    const [, payload] = accessToken.split('.')
    if (!payload) {
      console.warn('⚠️ AUTH: No payload found in access token for organization parsing')
      return []
    }
    
    const decoded: KeycloakTokenPayload = JSON.parse(atob(payload))
    console.log('🔍 AUTH: Token payload decoded successfully', { 
      sub: decoded.sub, 
      hasOrganizations: !!decoded.organizations,
      organizationCount: decoded.organizations ? Object.keys(decoded.organizations).length : 0
    })
    
    const organizations = decoded.organizations || {}
    
    const parsedOrgs = Object.entries(organizations).map(([name, data]) => ({
      name,
      id: data?.id || name
    }))
    
    console.log('✅ AUTH: Organizations parsed successfully', { 
      count: parsedOrgs.length, 
      organizations: parsedOrgs 
    })
    return parsedOrgs
  } catch (error) {
    console.error('❌ AUTH: Failed to parse organizations from token:', error)
    return []
  }
}

function parseRoles(accessToken: string): string[] {
  console.log('👥 AUTH: Starting role parsing from access token')
  try {
    const [, payload] = accessToken.split('.')
    if (!payload) {
      console.warn('⚠️ AUTH: No payload found in access token for role parsing')
      return []
    }
    
    const decoded: KeycloakTokenPayload = JSON.parse(atob(payload))
    console.log('🔍 AUTH: Token payload decoded for roles', { 
      sub: decoded.sub,
      hasRealmAccess: !!decoded.realm_access,
      hasResourceAccess: !!decoded.resource_access,
      realmRoles: decoded.realm_access?.roles?.length || 0
    })
    
    const roles: string[] = []
    
    // Get realm roles
    if (decoded.realm_access?.roles) {
      console.log('🌐 AUTH: Adding realm roles', decoded.realm_access.roles)
      roles.push(...decoded.realm_access.roles)
    }
    
    // Get client roles (resource_access)
    if (decoded.resource_access) {
      console.log('🔧 AUTH: Processing resource access roles')
      Object.entries(decoded.resource_access).forEach(([clientId, client]) => {
        if (client.roles) {
          console.log(`📱 AUTH: Adding roles from client ${clientId}:`, client.roles)
          roles.push(...client.roles)
        }
      })
    }
    
    const uniqueRoles = [...new Set(roles)]
    console.log('✅ AUTH: Roles parsed successfully', { 
      totalRoles: roles.length, 
      uniqueRoles: uniqueRoles.length, 
      roles: uniqueRoles 
    })
    return uniqueRoles
  } catch (error) {
    console.error('❌ AUTH: Failed to parse roles from token:', error)
    return []
  }
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  console.log('🔄 AUTH: Starting token refresh process', { 
    hasRefreshToken: !!token.refresh_token,
    expiresAt: token.expires_at,
    currentTime: Math.floor(Date.now() / 1000)
  })
  
  try {
    if (!token.refresh_token) {
      console.warn('⚠️ AUTH: No refresh token available for refresh')
      return token
    }

    const tokenUrl = `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`
    console.log('🌐 AUTH: Making token refresh request to:', tokenUrl)
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.AUTH_KEYCLOAK_ID!,
        client_secret: process.env.AUTH_KEYCLOAK_SECRET!,
        refresh_token: token.refresh_token
      })
    })

    console.log('📡 AUTH: Token refresh response received', { 
      status: response.status, 
      statusText: response.statusText,
      ok: response.ok 
    })

    if (!response.ok) {
      console.error('❌ AUTH: Failed to refresh token:', response.status, response.statusText)
      const errorText = await response.text()
      console.error('❌ AUTH: Refresh error details:', errorText)
      return { ...token, error: 'RefreshAccessTokenError' }
    }

    const data = await response.json()
    console.log('✅ AUTH: Token refresh successful', { 
      hasAccessToken: !!data.access_token,
      hasRefreshToken: !!data.refresh_token,
      hasIdToken: !!data.id_token,
      expiresIn: data.expires_in
    })

    const refreshedToken = {
      ...token,
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? token.refresh_token,
      id_token: data.id_token ?? token.id_token,
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      organizations: parseOrganizations(data.access_token),
      roles: parseRoles(data.access_token)
    }

    console.log('🎯 AUTH: Token refresh completed successfully')
    return refreshedToken
  } catch (error) {
    console.error('❌ AUTH: Error refreshing access token:', error)
    return { ...token, error: 'RefreshAccessTokenError' }
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.AUTH_KEYCLOAK_ID!,
      clientSecret: process.env.AUTH_KEYCLOAK_SECRET!,
      issuer: process.env.AUTH_KEYCLOAK_ISSUER!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  callbacks: {
    async jwt({ token, account }) {
      console.log('🎫 AUTH JWT CALLBACK: Processing JWT callback', { 
        hasToken: !!token,
        hasAccount: !!account,
        provider: account?.provider,
        tokenSub: token?.sub,
        accountType: account?.type
      })

      if (account?.provider === "keycloak") {
        console.log('🔑 AUTH JWT: Processing Keycloak login callback')
        console.log('📊 AUTH JWT: Account details', {
          provider: account.provider,
          type: account.type,
          hasAccessToken: !!account.access_token,
          hasRefreshToken: !!account.refresh_token,
          hasIdToken: !!account.id_token,
          expiresIn: account.expires_in,
          scope: account.scope
        })

        // Handle login with Keycloak
        token.id_token = account.id_token
        token.access_token = account.access_token
        token.refresh_token = account.refresh_token
        token.expires_at = Math.floor(Date.now() / 1000) + (account.expires_in ?? 0)

        console.log('⏰ AUTH JWT: Token expiry set', { 
          expiresAt: token.expires_at,
          expiresIn: account.expires_in,
          currentTime: Math.floor(Date.now() / 1000)
        })

        if (account.access_token && token.sub) {
          console.log('🏢 AUTH JWT: Processing organizations and roles for user:', token.sub)
          
          token.organizations = parseOrganizations(account.access_token)
          
          // Store roles in JWT token for client access
          const roles = parseRoles(account.access_token)
          token.roles = roles
          rolesManager.setUserRoles(token.sub, roles)
          
          console.log('👤 AUTH JWT: User roles stored in roles manager', { 
            userId: token.sub, 
            roleCount: roles.length 
          })
        }
        
        console.log('✅ AUTH JWT: Keycloak login processing completed')
      }

      // Refresh token if expired
      if (token.expires_at && Date.now() / 1000 >= token.expires_at - 60) {
        console.log('⏰ AUTH JWT: Token expired, initiating refresh', {
          expiresAt: token.expires_at,
          currentTime: Math.floor(Date.now() / 1000),
          bufferTime: 60
        })
        token = await refreshAccessToken(token)
      } else if (token.expires_at) {
        console.log('✅ AUTH JWT: Token still valid', {
          expiresAt: token.expires_at,
          currentTime: Math.floor(Date.now() / 1000),
          timeUntilExpiry: token.expires_at - Math.floor(Date.now() / 1000)
        })
      }

      console.log('🎫 AUTH JWT CALLBACK: JWT processing completed', { 
        hasSub: !!token.sub,
        hasAccessToken: !!token.access_token,
        hasError: !!token.error,
        organizationCount: token.organizations?.length || 0,
        roleCount: token.roles?.length || 0
      })

      return token
    },
    async session({ session, token }) {
      console.log('👤 AUTH SESSION CALLBACK: Processing session callback', { 
        hasSession: !!session,
        hasToken: !!token,
        tokenSub: token?.sub,
        sessionUserId: session?.user?.id
      })
      
      if (token.sub) {
        session.user.id = token.sub
        console.log('🆔 AUTH SESSION: User ID set from token:', token.sub)
      }
      
      if (token.organizations) {
        session.user.organizations = token.organizations
        console.log('🏢 AUTH SESSION: Organizations added to session', { 
          count: token.organizations.length,
          organizations: token.organizations.map(org => org.name)
        })
      }
      
      if (token.roles) {
        session.user.roles = token.roles
        console.log('👥 AUTH SESSION: Roles added to session', { 
          count: token.roles.length,
          roles: token.roles 
        })
      }
      
      if (token.access_token) {
        session.access_token = token.access_token
        console.log('🔑 AUTH SESSION: Access token added to session')
      }

      if (token.refresh_token) {
        session.refresh_token = token.refresh_token
        console.log('🔄 AUTH SESSION: Refresh token added to session')
      }

      if (token.error) {
        console.error('❌ AUTH SESSION: Token error present:', token.error)
      }
      
      console.log('✅ AUTH SESSION CALLBACK: Session processing completed', {
        userId: session.user.id,
        hasOrganizations: !!session.user.organizations,
        hasRoles: !!session.user.roles,
        hasAccessToken: !!session.access_token
      })
      
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const pathname = nextUrl.pathname

      console.log('🔐 AUTH AUTHORIZED: Checking authorization', { 
        pathname,
        isLoggedIn,
        userId: auth?.user?.id,
        userRoles: auth?.user?.roles?.length || 0
      })

      const isProtected = pathname.startsWith('/dashboard') || 
                         pathname.startsWith('/areas') ||
                         pathname.startsWith('/calls') ||
                         pathname.startsWith('/parties') ||
                         pathname.startsWith('/user-management') ||
                         pathname.startsWith('/cities') ||
                         pathname.startsWith('/districts') ||
                         pathname.startsWith('/states') ||
                         pathname.startsWith('/products') ||
                         pathname.startsWith('/sources') ||
                         pathname.startsWith('/priorities') ||
                         pathname.startsWith('/call-types') ||
                         pathname.startsWith('/sub-call-types') ||
                         pathname.startsWith('/call-categories') ||
                         pathname.startsWith('/call-statuses') ||
                         pathname.startsWith('/call-remarks') ||
                         pathname.startsWith('/channel-types') ||
                         pathname.startsWith('/organizations')
      
      const isOrganizationSetup = pathname.startsWith('/organization-setup')
      
      if (isProtected) {
        if (isLoggedIn) {
          console.log('✅ AUTH AUTHORIZED: Access granted to protected route', { pathname, userId: auth.user.id })
          return true
        } else {
          console.log('❌ AUTH AUTHORIZED: Access denied to protected route - not logged in', { pathname })
          return false
        }
      } else if (isOrganizationSetup) {
        // Allow access to organization setup if logged in
        if (isLoggedIn) {
          console.log('✅ AUTH AUTHORIZED: Access granted to organization setup', { pathname, userId: auth.user.id })
          return true
        } else {
          console.log('❌ AUTH AUTHORIZED: Access denied to organization setup - not logged in', { pathname })
          return false
        }
      } else if (isLoggedIn && pathname === '/') {
        console.log('🔄 AUTH AUTHORIZED: Redirecting logged-in user from root to dashboard', { userId: auth.user.id })
        return Response.redirect(new URL('/dashboard', nextUrl))
      }
      
      console.log('✅ AUTH AUTHORIZED: Public route access granted', { pathname, isLoggedIn })
      return true
    },
  },
  events: {
    async signOut({ token }) {
      console.log('👋 AUTH SIGNOUT: Processing signout event', { 
        hasToken: !!token,
        tokenSub: token?.sub,
        hasIdToken: !!token?.id_token
      })

      // Clear roles from roles manager on signout
      if (token?.sub) {
        rolesManager.clearUserRoles(token.sub)
        console.log('🧹 AUTH SIGNOUT: Roles cleared from roles manager for user:', token.sub)
      }
      
      if (token?.id_token) {
        console.log('🔚 AUTH SIGNOUT: Attempting Keycloak logout')
        try {
          const keycloakIssuer = process.env.AUTH_KEYCLOAK_ISSUER
          const authUrl = process.env.AUTH_URL
          
          if (!keycloakIssuer || !authUrl) {
            console.warn('⚠️ AUTH SIGNOUT: Missing KEYCLOAK_ISSUER or AUTH_URL for logout', {
              hasKeycloakIssuer: !!keycloakIssuer,
              hasAuthUrl: !!authUrl
            })
            return
          }
          
          const logoutUrl = new URL(`${keycloakIssuer}/protocol/openid-connect/logout`)
          logoutUrl.searchParams.set('id_token_hint', token.id_token as string)
          logoutUrl.searchParams.set('post_logout_redirect_uri', authUrl)
          
          console.log('🌐 AUTH SIGNOUT: Making logout request to Keycloak:', logoutUrl.toString())
          
          const response = await fetch(logoutUrl.toString(), {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          })
          
          console.log('📡 AUTH SIGNOUT: Keycloak logout response', { 
            status: response.status, 
            statusText: response.statusText,
            ok: response.ok 
          })
          
          if (!response.ok) {
            console.warn(`⚠️ AUTH SIGNOUT: Keycloak logout warning: ${response.status} ${response.statusText}`)
          } else {
            console.log('✅ AUTH SIGNOUT: Keycloak logout successful')
          }
        } catch (error) {
          console.error('❌ AUTH SIGNOUT: Keycloak logout error:', error)
        }
      }
      
      console.log('✅ AUTH SIGNOUT: Signout event completed')
    },
  },
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      console.error(`❌ NEXTAUTH ERROR [${code}]:`, metadata)
    },
    warn(code) {
      console.warn(`⚠️ NEXTAUTH WARNING [${code}]`)
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`🐛 NEXTAUTH DEBUG [${code}]:`, metadata)
      }
    }
  },
  trustHost: true,
})

console.log('✅ AUTH.TS: NextAuth configuration initialized successfully')
