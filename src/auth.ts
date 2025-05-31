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
    }
  }
  
  interface JWT {
    id_token?: string
    organizations?: Array<{ name: string; id: string }>
  }
}

interface KeycloakTokenPayload {
  sub: string
  organizations?: Record<string, { id: string }>
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
    console.error('Failed to parse organizations from token:', error)
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
        token.id_token = account.id_token
        
        if (account.access_token) {
          token.organizations = parseOrganizations(account.access_token)
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
