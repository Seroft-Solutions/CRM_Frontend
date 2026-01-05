/**
 * Keycloak Integration Service
 * Handles communication with Keycloak server
 */

/**
 * Keycloak token response
 */
interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
}

/**
 * Keycloak error response
 */
interface KeycloakErrorResponse {
  error: string;
  error_description?: string;
}

/**
 * Refresh token with Keycloak
 */
export async function refreshTokenWithKeycloak(
  refreshToken: string
): Promise<KeycloakTokenResponse> {
  const tokenUrl = `${process.env.AUTH_KEYCLOAK_ISSUER}/protocol/openid-connect/token`;
  const clientSecret = process.env.AUTH_KEYCLOAK_SECRET;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.AUTH_KEYCLOAK_ID!,
    refresh_token: refreshToken,
  });

  if (clientSecret) {
    body.set('client_secret', clientSecret);
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorDetails: KeycloakErrorResponse;

    try {
      errorDetails = JSON.parse(errorText);
    } catch {
      errorDetails = {
        error: 'invalid_grant',
        error_description: errorText,
      };
    }

    throw new Error(
      `Keycloak refresh failed (${response.status}): ${errorDetails.error} - ${errorDetails.error_description || 'No description'}`
    );
  }

  const data: KeycloakTokenResponse = await response.json();

  if (!data.access_token) {
    throw new Error('Invalid Keycloak response: missing access_token');
  }

  return data;
}

/**
 * Logout from Keycloak
 */
export async function logoutFromKeycloak(idToken: string, redirectUri: string): Promise<void> {
  const keycloakIssuer = process.env.AUTH_KEYCLOAK_ISSUER;

  if (!keycloakIssuer) {
    console.warn('Missing AUTH_KEYCLOAK_ISSUER for logout');

    return;
  }

  const logoutUrl = new URL(`${keycloakIssuer}/protocol/openid-connect/logout`);

  logoutUrl.searchParams.set('id_token_hint', idToken);
  logoutUrl.searchParams.set('post_logout_redirect_uri', redirectUri);

  const response = await fetch(logoutUrl.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    console.warn(`Keycloak logout warning: ${response.status} ${response.statusText}`);
  }
}

/**
 * Check if error is a token expiration error
 */
export function isTokenExpiredError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes('invalid_grant') ||
    message.includes('token expired') ||
    message.includes('refresh failed (400)') ||
    message.includes('refresh failed (401)')
  );
}

/**
 * Check if error is a temporary/network error
 */
export function isTemporaryError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();

  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('econnrefused') ||
    message.includes('fetch failed')
  );
}
