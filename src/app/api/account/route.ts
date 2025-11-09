/**
 * User Account API Route
 * Provides user account information including authorities/permissions
 * Fallback implementation when Spring backend is not available
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { keycloakService } from '@/core/api/services/keycloak-service';
import {
  getAdminRealmsRealmUsersUserId,
  type UserRepresentation,
} from '@/core/api/generated/keycloak';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = session.user.id;
    console.log('Fetching account data for user:', userId);

    let userData: UserRepresentation | null = null;
    let useSessionFallback = false;

    try {
      const realm = keycloakService.getRealm();
      userData = await getAdminRealmsRealmUsersUserId(realm, userId);
      console.log('Successfully fetched user from Keycloak');
    } catch (keycloakError: any) {
      console.warn('Keycloak service unavailable, using session fallback:', keycloakError.message);
      useSessionFallback = true;

      userData = {
        id: userId,
        username: session.user.email?.split('@')[0] || 'user',
        firstName: session.user.name?.split(' ')[0] || 'User',
        lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
        email: session.user.email || '',
        enabled: true,
        attributes: {
          user_type: ['admin'],
        },
      } as UserRepresentation;
    }

    const authorities: string[] = [];

    if (userData.attributes?.roles) {
      userData.attributes.roles.forEach((role) => {
        authorities.push(`ROLE_${role.toUpperCase()}`);
      });
    }

    if (userData.attributes?.user_type) {
      userData.attributes.user_type.forEach((userType) => {
        authorities.push(`ROLE_${userType.toUpperCase()}`);
      });
    }

    if (userData.attributes?.organization) {
      userData.attributes.organization.forEach((orgId) => {
        authorities.push(`GROUP_ORG_${orgId}`);
      });
    }

    const userType = userData.attributes?.user_type?.[0];
    if (userType === 'admin') {
      authorities.push('ROLE_ADMIN');
      authorities.push('ROLE_CALL_CREATE');
      authorities.push('ROLE_CALL_READ');
      authorities.push('ROLE_CALL_UPDATE');
      authorities.push('ROLE_CALL_DELETE');
      authorities.push('ROLE_CUSTOMER_CREATE');
      authorities.push('ROLE_CUSTOMER_READ');
      authorities.push('ROLE_CUSTOMER_UPDATE');
      authorities.push('ROLE_CUSTOMER_DELETE');
      authorities.push('ROLE_PARTNER_CREATE');
      authorities.push('ROLE_PARTNER_READ');
      authorities.push('ROLE_PARTNER_UPDATE');
      authorities.push('ROLE_PARTNER_DELETE');
    } else if (userType === 'partner' || userType === 'business_partner') {
      authorities.push('ROLE_PARTNER');
      authorities.push('ROLE_CALL_CREATE');
      authorities.push('ROLE_CALL_READ');
      authorities.push('ROLE_CALL_UPDATE');
      authorities.push('ROLE_CUSTOMER_CREATE');
      authorities.push('ROLE_CUSTOMER_READ');
      authorities.push('ROLE_CUSTOMER_UPDATE');
    } else {
      authorities.push('ROLE_USER');
      authorities.push('ROLE_CALL_READ');
      authorities.push('ROLE_CUSTOMER_READ');
    }

    const accountData = {
      id: userData.id,
      login: userData.username,
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      imageUrl: userData.attributes?.avatar?.[0] || null,
      activated: userData.enabled || false,
      langKey: userData.attributes?.language?.[0] || 'en',
      createdBy: 'system',
      createdDate: new Date(userData.createdTimestamp || Date.now()).toISOString(),
      lastModifiedBy: 'system',
      lastModifiedDate: new Date().toISOString(),
      authorities: [...new Set(authorities)],
    };

    console.log('Account data prepared:', {
      userId: accountData.id,
      email: accountData.email,
      authoritiesCount: accountData.authorities.length,
      authorities: accountData.authorities,
      source: useSessionFallback ? 'session-fallback' : 'keycloak',
    });

    return NextResponse.json(accountData);
  } catch (error: any) {
    console.error('Account API error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
