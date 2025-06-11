import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"
import { rolesManager } from "@/components/auth/roles-manager"

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
    
    return Object.entries(organizations).map(([name, data]) => ({
      name,
      id: data?.id || name
    }))
  } catch (error) {
    console.error('Failed to parse organizations:', error)
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
    
    // Get client roles
    if (decoded.resource_access) {
      Object.values(decoded.resource_access).forEach(client => {
        if (client.roles) {
          roles.push(...client.roles)
        }
      })
    }
    
    return [...new Set(roles)]
  } catch (error) {
    console.error('Failed to parse roles:', error)
    return []
  }
}

async function refreshAccessToken(token: any): Promise<any> {
  try {
    if (!token.refresh_token) return token

    const response = await fetch(`${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`, {
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
    console.error('Token refresh error:', error)
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
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, account }) {
      try {
        if (account?.provider === "keycloak" && account.access_token) {
          // Initial login
          token.access_token = account.access_token
          token.refresh_token = account.refresh_token
          token.id_token = account.id_token
          token.expires_at = Math.floor(Date.now() / 1000) + (account.expires_in ?? 0)

          if (token.sub) {
            token.organizations = parseOrganizations(account.access_token)
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
      } catch (error) {
        console.error('JWT callback error:', error)
        return token
      }
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
      const pathname = nextUrl.pathname
      
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
        return isLoggedIn
      } else if (isOrganizationSetup) {
        return isLoggedIn
      } else if (isLoggedIn && pathname === '/') {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }
      
      return true
    },
  },
  events: {
    async signOut({ token }) {
      if (token?.sub) {
        rolesManager.clearUserRoles(token.sub)
      }
      
      if (token?.id_token) {
        try {
          const keycloakIssuer = process.env.AUTH_KEYCLOAK_ISSUER
          const authUrl = process.env.AUTH_URL
          
          if (keycloakIssuer && authUrl) {
            const logoutUrl = new URL(`${keycloakIssuer}/protocol/openid-connect/logout`)
            logoutUrl.searchParams.set('id_token_hint', token.id_token as string)
            logoutUrl.searchParams.set('post_logout_redirect_uri', authUrl)
            
            await fetch(logoutUrl.toString(), { method: 'GET' })
          }
        } catch (error) {
          console.error('Keycloak logout error:', error)
        }
      }
    },
  },
  trustHost: true,
})
