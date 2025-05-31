import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"

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
  }
  
  interface JWT {
    id_token?: string
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
    console.log('=== ACCESS TOKEN ===')
    console.log('Access Token:', accessToken)
    
    const [, payload] = accessToken.split('.')
    if (!payload) return []
    
    const decoded: KeycloakTokenPayload = JSON.parse(atob(payload))
    const organizations = decoded.organizations || {}
    
    console.log('=== PARSED ORGANIZATIONS ===')
    console.log('Raw organizations from token:', organizations)
    
    const parsedOrgs = Object.entries(organizations).map(([name, data]) => ({
      name,
      id: data?.id || name
    }))
    
    console.log('Formatted organizations:', parsedOrgs)
    
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
    
    console.log('=== PARSED ROLES ===')
    console.log('Raw token payload for roles:', {
      realm_access: decoded.realm_access,
      resource_access: decoded.resource_access
    })
    
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
    
    console.log('Parsed roles:', roles)
    
    return [...new Set(roles)] // Remove duplicates
  } catch (error) {
    console.error('Failed to parse roles from token:', error)
    return []
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
    async jwt({ token, account, trigger }) {
      if (account?.provider === "keycloak") {
        console.log('=== JWT CALLBACK - KEYCLOAK AUTH ===')
        console.log('Account access token available:', !!account.access_token)
        
        token.id_token = account.id_token
        
        if (account.access_token) {
          console.log('Processing access token for organizations and roles...')
          token.organizations = parseOrganizations(account.access_token)
          token.roles = parseRoles(account.access_token)
          console.log('Organizations set on token:', token.organizations)
          console.log('Roles set on token:', token.roles)
        }
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
                         nextUrl.pathname.startsWith('/channel-types')
      
      if (isProtected) {
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
