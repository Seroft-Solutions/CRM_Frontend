import NextAuth from "next-auth"
import Keycloak from "next-auth/providers/keycloak"

console.log('🔧 MINIMAL AUTH: Initializing minimal NextAuth configuration')

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
      console.log('🎫 MINIMAL JWT: Called', { hasAccount: !!account, provider: account?.provider })
      return token
    },
    async session({ session, token }) {
      console.log('🚨 MINIMAL SESSION: Called successfully!')
      return session
    },
  },
  debug: true,
  trustHost: true,
})

console.log('✅ MINIMAL AUTH: Configuration complete')
