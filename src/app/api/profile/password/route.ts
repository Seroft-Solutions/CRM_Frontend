/**
 * User Profile Password Update API Route
 * Handles updating user password in Keycloak
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { keycloakService } from '@/core/api/services/keycloak-service';
import type { CredentialRepresentation, UserRepresentation } from '@/core/api/generated/keycloak';
import {
  getAdminRealmsRealmUsers,
  getAdminRealmsRealmUsersUserId,
  putAdminRealmsRealmUsersUserIdResetPassword,
} from '@/core/api/generated/keycloak';

export interface UpdatePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

type AccountPasswordUpdateResult =
  | { status: 'success' }
  | { status: 'invalid_current_password' }
  | { status: 'validation_error'; message: string }
  | { status: 'unsupported'; message?: string }
  | { status: 'error'; message: string };

type CurrentPasswordVerificationResult =
  | { status: 'verified' }
  | { status: 'invalid_credentials' }
  | { status: 'unavailable'; message: string };

const DIRECT_GRANT_CONFIG_ERRORS = new Set([
  'unauthorized_client',
  'invalid_client',
  'unsupported_grant_type',
  'access_denied',
]);

interface DirectGrantClientConfig {
  clientId: string;
  clientSecret?: string;
}

/**
 * Update user password in Keycloak
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No authenticated user found' }, { status: 401 });
    }

    const realm = keycloakService.getRealm();

    if (!realm) {
      throw new Error('Realm configuration missing');
    }

    const updateData: UpdatePasswordRequest = await request.json();
    const { currentPassword, newPassword } = updateData;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    const accountApiResult = await updatePasswordThroughAccountApi({
      issuer: process.env.AUTH_KEYCLOAK_ISSUER,
      accessToken: session.access_token,
      currentPassword,
      newPassword,
    });

    if (accountApiResult.status === 'success') {
      return NextResponse.json({
        message: 'Password updated successfully',
        userId: session.user.id,
      });
    }

    if (accountApiResult.status === 'invalid_current_password') {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    if (accountApiResult.status === 'validation_error') {
      return NextResponse.json({ error: accountApiResult.message }, { status: 400 });
    }

    if (accountApiResult.status === 'error') {
      return NextResponse.json({ error: accountApiResult.message }, { status: 500 });
    }

    const permissionCheck = await keycloakService.verifyAdminPermissions();

    if (!permissionCheck.authorized) {
      return NextResponse.json({ error: permissionCheck.error }, { status: 401 });
    }

    let keycloakUser: UserRepresentation | null = null;
    let userId = session.user.id;

    try {
      keycloakUser = await getAdminRealmsRealmUsersUserId(realm, userId);
    } catch {
      if (session.user.email) {
        const users = await getAdminRealmsRealmUsers(realm, {
          email: session.user.email,
          exact: true,
        });

        if (users && users.length > 0) {
          keycloakUser = users[0];
          userId = keycloakUser.id!;
        }
      }
    }

    if (!keycloakUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const passwordVerification = await verifyCurrentPassword({
      password: currentPassword,
      identifiers: [keycloakUser.username, session.user.email, keycloakUser.email],
    });

    if (passwordVerification.status === 'invalid_credentials') {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    if (passwordVerification.status === 'unavailable') {
      return NextResponse.json(
        {
          error:
            'Unable to verify your current password with the current Keycloak configuration. ' +
            passwordVerification.message,
        },
        { status: 500 }
      );
    }

    const passwordCredential: CredentialRepresentation = {
      type: 'password',
      value: newPassword,
      temporary: false,
    };

    await putAdminRealmsRealmUsersUserIdResetPassword(realm, userId, passwordCredential);

    return NextResponse.json({
      message: 'Password updated successfully',
      userId,
    });
  } catch (error: unknown) {
    console.error('Profile password update API error:', error);

    const errorStatus = getErrorStatus(error);

    if (errorStatus === 404) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (errorStatus === 403) {
      return NextResponse.json(
        { error: 'Access denied. Insufficient permissions.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to update password') },
      { status: errorStatus }
    );
  }
}

/**
 * Preferred flow: update password through Keycloak account API using the current user access token.
 */
async function updatePasswordThroughAccountApi(params: {
  issuer?: string;
  accessToken?: string;
  currentPassword: string;
  newPassword: string;
}): Promise<AccountPasswordUpdateResult> {
  if (!params.issuer || !params.accessToken) {
    return {
      status: 'unsupported',
      message: 'Missing Keycloak issuer or access token',
    };
  }

  const endpoints = [
    { method: 'POST', path: '/account/credentials/password' },
    { method: 'PUT', path: '/account/credentials/password' },
    { method: 'POST', path: '/account/password' },
    { method: 'PUT', path: '/account/password' },
  ] as const;

  const payload = {
    currentPassword: params.currentPassword,
    newPassword: params.newPassword,
    confirmation: params.newPassword,
  };

  let lastUnsupportedReason: string | undefined;

  for (const endpoint of endpoints) {
    const response = await fetch(`${params.issuer}${endpoint.path}`, {
      method: endpoint.method,
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (response.ok || response.status === 204) {
      return { status: 'success' };
    }

    const errorData = await parseErrorBody(response);
    const normalizedError = `${errorData.error} ${errorData.errorDescription} ${errorData.raw}`
      .toLowerCase()
      .trim();

    if (response.status === 400) {
      if (isCurrentPasswordError(normalizedError)) {
        return { status: 'invalid_current_password' };
      }

      return {
        status: 'validation_error',
        message:
          errorData.errorDescription || 'Password does not meet Keycloak policy requirements',
      };
    }

    if (
      response.status === 401 ||
      response.status === 403 ||
      response.status === 404 ||
      response.status === 405
    ) {
      lastUnsupportedReason =
        errorData.errorDescription || `Account API unavailable (${response.status})`;
      continue;
    }

    return {
      status: 'error',
      message: errorData.errorDescription || `Failed to update password (${response.status})`,
    };
  }

  return {
    status: 'unsupported',
    message: lastUnsupportedReason,
  };
}

/**
 * Fallback flow: verify current password with direct grant before admin reset-password call.
 */
async function verifyCurrentPassword(params: {
  password: string;
  identifiers: Array<string | null | undefined>;
}): Promise<CurrentPasswordVerificationResult> {
  const issuer = process.env.AUTH_KEYCLOAK_ISSUER;

  if (!issuer) {
    return {
      status: 'unavailable',
      message: 'Missing AUTH_KEYCLOAK_ISSUER',
    };
  }

  const tokenUrl = `${issuer}/protocol/openid-connect/token`;
  const uniqueIdentifiers = Array.from(
    new Set(
      params.identifiers.filter((value): value is string => !!value && value.trim().length > 0)
    )
  );

  if (uniqueIdentifiers.length === 0) {
    return {
      status: 'unavailable',
      message: 'No identifier available for current password verification',
    };
  }

  const directGrantClients = getDirectGrantClients();

  if (directGrantClients.length === 0) {
    return {
      status: 'unavailable',
      message: 'No direct-grant client is configured for password verification',
    };
  }

  let hasInvalidGrant = false;
  let hasUsableClient = false;
  const configErrors: string[] = [];

  for (const client of directGrantClients) {
    let clientHasCredentialResponse = false;

    for (const identifier of uniqueIdentifiers) {
      const body = new URLSearchParams({
        grant_type: 'password',
        client_id: client.clientId,
        username: identifier,
        password: params.password,
      });

      if (client.clientSecret) {
        body.append('client_secret', client.clientSecret);
      }

      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (response.ok) {
        return { status: 'verified' };
      }

      const errorData = await parseErrorBody(response);

      if (errorData.error === 'invalid_grant') {
        hasInvalidGrant = true;
        clientHasCredentialResponse = true;
        continue;
      }

      if (DIRECT_GRANT_CONFIG_ERRORS.has(errorData.error)) {
        configErrors.push(
          `[${client.clientId}] ${
            errorData.errorDescription || `Direct grant unavailable: ${errorData.error}`
          }`
        );
        clientHasCredentialResponse = false;
        break;
      }

      return {
        status: 'unavailable',
        message:
          errorData.errorDescription ||
          errorData.raw ||
          `Unexpected direct-grant response (${response.status})`,
      };
    }

    if (clientHasCredentialResponse) {
      hasUsableClient = true;
    }
  }

  if (hasUsableClient && hasInvalidGrant) {
    return { status: 'invalid_credentials' };
  }

  return {
    status: 'unavailable',
    message:
      configErrors.length > 0 ? configErrors.join(' | ') : 'Unable to verify current password',
  };
}

function getDirectGrantClients(): DirectGrantClientConfig[] {
  const clients: DirectGrantClientConfig[] = [];
  const seen = new Set<string>();

  const addClient = (clientId?: string, clientSecret?: string) => {
    if (!clientId || seen.has(clientId)) {
      return;
    }

    seen.add(clientId);
    clients.push({ clientId, clientSecret });
  };

  addClient(process.env.AUTH_KEYCLOAK_ID, process.env.AUTH_KEYCLOAK_SECRET);
  addClient(process.env.KEYCLOAK_PASSWORD_VERIFY_CLIENT_ID || 'admin-cli');

  return clients;
}

function isCurrentPasswordError(errorText: string): boolean {
  return (
    errorText.includes('invalidpasswordexistingmessage') ||
    errorText.includes('current password') ||
    errorText.includes('invalid current password') ||
    errorText.includes('invalid_grant')
  );
}

async function parseErrorBody(response: Response): Promise<{
  error: string;
  errorDescription: string;
  raw: string;
}> {
  const raw = await response.text();

  if (!raw) {
    return { error: '', errorDescription: '', raw: '' };
  }

  try {
    const parsed = JSON.parse(raw);

    return {
      error: String(parsed?.error ?? ''),
      errorDescription: String(
        parsed?.error_description ?? parsed?.errorDescription ?? parsed?.message ?? ''
      ),
      raw,
    };
  } catch {
    return {
      error: '',
      errorDescription: '',
      raw,
    };
  }
}

function getErrorStatus(error: unknown): number {
  if (typeof error === 'object' && error !== null && 'status' in error) {
    const status = (error as { status?: unknown }).status;

    if (typeof status === 'number') {
      return status;
    }
  }

  return 500;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
