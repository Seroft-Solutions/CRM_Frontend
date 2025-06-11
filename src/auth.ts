import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"
import { rolesManager } from "@/components/auth/roles-manager"

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
  try {
    
    const [, payload] = accessToken.split('.')
    if (!payload) return []
    
    const decoded: KeycloakTokenPayload = JSON.parse(atob(payload))
    const organizations = decoded.organizations || {}
    
    
    const parsedOrgs = Object.entries(organizations).map(([name, data]) => ({
      name,
      id: data?.id || name
    }))
    
    
    return parsedOrgs
  } catch (error) {
    console.error('Failed to parse organizations from token:', error)
    return []
  }
}

function parseRoles(accessToken: string): string[] {
  try {
    const [, payload] = accessToken.split('.')
    if (!payload) return []
    
    const decoded: KeycloakTokenPayload = JSON.parse(atob(payload))
    
    
    const roles: string[] = []
    
    // Get realm roles
    if (decoded.realm_access?.roles) {
      roles.push(...decoded.realm_access.roles)
    }
    
    // Get client roles (resource_access)
    if (decoded.resource_access) {
      Object.values(decoded.resource_access).forEach(client => {
        if (client.roles) {
          roles.push(...client.roles)
        }
      })
    }
    
    
    return [...new Set(roles)] // Remove duplicates
  } catch (error) {
    console.error('Failed to parse roles from token:', error)
    return []
  }
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    if (!token.refresh_token) return token

    const tokenUrl = `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`
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

    if (!response.ok) {
      console.error('Failed to refresh token:', response.status)
      return { ...token, error: 'RefreshAccessTokenError' }
    }

    const data = await response.json()

    return {
      ...token,
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? token.refresh_token,
      id_token: data.id_token ?? token.id_token,
      expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      organizations: parseOrganizations(data.access_token),
      roles: parseRoles(data.access_token)
    }
  } catch (error) {
    console.error('Error refreshing access token:', error)
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
      if (account?.provider === "keycloak") {
        // Handle login with Keycloak

        token.id_token = account.id_token
        token.access_token = account.access_token
        token.refresh_token = account.refresh_token
        token.expires_at = Math.floor(Date.now() / 1000) + (account.expires_in ?? 0)

        if (account.access_token && token.sub) {
          token.organizations = parseOrganizations(account.access_token)
          
          // Store roles in JWT token for client access
          const roles = parseRoles(account.access_token)
          token.roles = roles
          rolesManager.setUserRoles(token.sub, roles)
          
        }
      }

      // Refresh token if expired
      if (token.expires_at && Date.now() / 1000 >= token.expires_at - 60) {
        token = await refreshAccessToken(token)
      }

      return token
    },
    async session({ session, token }) {
      
      if (token.sub) {
        session.user.id = token.sub
      }
      
      if (token.organizations) {
        session.user.organizations = token.organizations
      }
      
      if (token.roles) {
        session.user.roles = token.roles
      }
      
      if (token.access_token) {
        session.access_token = token.access_token
      }

      if (token.refresh_token) {
        session.refresh_token = token.refresh_token
      }
      
      return session
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isProtected = nextUrl.pathname.startsWith('/dashboard') || 
                         nextUrl.pathname.startsWith('/areas') ||
                         nextUrl.pathname.startsWith('/calls') ||
                         nextUrl.pathname.startsWith('/parties') ||
                         nextUrl.pathname.startsWith('/user-management') ||
                         nextUrl.pathname.startsWith('/cities') ||
                         nextUrl.pathname.startsWith('/districts') ||
                         nextUrl.pathname.startsWith('/states') ||
                         nextUrl.pathname.startsWith('/products') ||
                         nextUrl.pathname.startsWith('/sources') ||
                         nextUrl.pathname.startsWith('/priorities') ||
                         nextUrl.pathname.startsWith('/call-types') ||
                         nextUrl.pathname.startsWith('/sub-call-types') ||
                         nextUrl.pathname.startsWith('/call-categories') ||
                         nextUrl.pathname.startsWith('/call-statuses') ||
                         nextUrl.pathname.startsWith('/call-remarks') ||
                         nextUrl.pathname.startsWith('/channel-types') ||
                         nextUrl.pathname.startsWith('/organizations')
      
      const isOrganizationSetup = nextUrl.pathname.startsWith('/organization-setup')
      
      if (isProtected) {
        if (isLoggedIn) return true
        return false
      } else if (isOrganizationSetup) {
        // Allow access to organization setup if logged in
        if (isLoggedIn) return true
        return false
      } else if (isLoggedIn && nextUrl.pathname === '/') {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }
      
      return true
    },
  },
  events: {
    async signOut({ token }) {
      // Clear roles from roles manager on signout
      if (token?.sub) {
        rolesManager.clearUserRoles(token.sub)
      }
      
      if (token?.id_token) {
        try {
          const keycloakIssuer = process.env.AUTH_KEYCLOAK_ISSUER
          const authUrl = process.env.AUTH_URL
          
          if (!keycloakIssuer || !authUrl) {
            console.warn('Missing KEYCLOAK_ISSUER or AUTH_URL for logout')
            return
          }
          
          const logoutUrl = new URL(`${keycloakIssuer}/protocol/openid-connect/logout`)
          logoutUrl.searchParams.set('id_token_hint', token.id_token as string)
          logoutUrl.searchParams.set('post_logout_redirect_uri', authUrl)
          
          const response = await fetch(logoutUrl.toString(), {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          })
          
          if (!response.ok) {
            console.warn(`Keycloak logout warning: ${response.status} ${response.statusText}`)
          }
        } catch (error) {
          console.error('Keycloak logout error:', error)
        }
      }
    },
  },
  trustHost: true,
})
