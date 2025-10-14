/**
 * Set Password API Route
 * Allows users to set their password after magic link onboarding
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  putAdminRealmsRealmUsersUserIdResetPassword,
  getAdminRealmsRealmUsersUserId,
} from '@/core/api/generated/keycloak';
import { keycloakService } from '@/core/api/services/keycloak-service';
import type { CredentialRepresentation } from '@/core/api/generated/keycloak';

interface SetPasswordRequest {
  userId: string;
  password: string;
}

// Password validation regex
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[!@#$%^&*(),.?":{}|<>]/,
};

function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`);
  }

  if (!PASSWORD_REGEX.uppercase.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!PASSWORD_REGEX.lowercase.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!PASSWORD_REGEX.number.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!PASSWORD_REGEX.special.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*...)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: SetPasswordRequest = await request.json();
    const { userId, password } = body;

    // Validate required fields
    if (!userId) {
      console.warn('[Auth/SetPassword] Missing userId in request');
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!password) {
      console.warn('[Auth/SetPassword] Missing password in request');
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      console.warn('[Auth/SetPassword] Password validation failed', {
        userId,
        errors: passwordValidation.errors,
      });
      return NextResponse.json(
        {
          error: 'Password does not meet requirements',
          details: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    const realm = keycloakService.getRealm();

    // Verify user exists
    console.log('[Auth/SetPassword] Verifying user exists:', userId);
    try {
      await getAdminRealmsRealmUsersUserId(realm, userId);
    } catch (error: any) {
      if (error.status === 404) {
        console.error('[Auth/SetPassword] User not found:', userId);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      throw error;
    }

    // Set permanent password in Keycloak
    console.log('[Auth/SetPassword] Setting permanent password for user:', userId);
    const credential: CredentialRepresentation = {
      type: 'password',
      value: password,
      temporary: false, // NOT temporary - this is their permanent password
    };

    await putAdminRealmsRealmUsersUserIdResetPassword(realm, userId, credential);

    const duration = Date.now() - startTime;
    console.log('[Auth/SetPassword] ✓ Password set successfully', {
      userId,
      duration: `${duration}ms`,
    });

    return NextResponse.json({
      success: true,
      message: 'Password set successfully',
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error('[Auth/SetPassword] ✗ Password setup failed', {
      error: error.message,
      status: error.status,
      duration: `${duration}ms`,
    });

    // Handle specific error cases
    if (error.status === 403) {
      return NextResponse.json(
        { error: 'Insufficient permissions to set password' },
        { status: 403 }
      );
    }

    if (error.status === 404) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to set password',
        details: error.response?.data,
      },
      { status: error.status || 500 }
    );
  }
}
