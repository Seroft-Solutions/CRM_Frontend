import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";

// Extend the JWT interface to include id_token and provider
declare module "next-auth/jwt" {
  interface JWT {
    id_token?: string;
    provider?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [Keycloak],
  callbacks: {
    jwt: async ({ token, account }) => {
      if (account) {
        token.id_token = account.id_token;
        token.provider = account.provider;
        console.log("JWT Callback - id_token:", token.id_token); // Debug log
      }
      return token;
    },
  },
  events: {
    signOut: async ({ token }) => {
      if (token.provider === "keycloak") {
        const issuer = process.env.AUTH_KEYCLOAK_ISSUER;
        if (!issuer) {
          console.error("AUTH_KEYCLOAK_ISSUER is not defined");
          return;
        }
        const logoutUrl = `${issuer}/protocol/openid-connect/logout?id_token_hint=${token.id_token}`;
        try {
          const response = await fetch(logoutUrl);
          if (!response.ok) {
            throw new Error(`Failed to logout from Keycloak: ${response.statusText}`);
          }
        } catch (error) {
          console.error("Failed to logout from Keycloak", error);
        }
      }
    },
  },
});