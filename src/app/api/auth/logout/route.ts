import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { getToken } from 'next-auth/jwt';

export async function GET(req: Request) {
  try {
    // Get the JWT token to access the id_token
    const token = await getToken({ req });
    
    // If no token, return success (nothing to log out)
    if (!token?.id_token) {
      return NextResponse.json({ success: true });
    }
    
    // Construct Keycloak logout URL
    const keycloakIssuer = process.env.AUTH_KEYCLOAK_ISSUER;
    if (!keycloakIssuer) {
      return NextResponse.json(
        { success: false, message: "Keycloak issuer not configured" },
        { status: 500 }
      );
    }
    
    // Create logout URL with redirect back to app
    const appUrl = process.env.NEXTAUTH_URL || '';
    const logoutUrl = new URL(`${keycloakIssuer}/protocol/openid-connect/logout`);
    logoutUrl.searchParams.append('id_token_hint', token.id_token);
    logoutUrl.searchParams.append('post_logout_redirect_uri', appUrl);
    
    // Call Keycloak logout endpoint
    try {
      await fetch(logoutUrl.toString(), { method: 'GET' });
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        { success: false, message: "Error during Keycloak logout" },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}