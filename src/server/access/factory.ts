import { addMinutes } from 'date-fns';
import {
  getAdminRealmsRealmUsers,
  getAdminRealmsRealmUsersUserId,
  getAdminRealmsRealmOrganizationsOrgId,
  postAdminRealmsRealmOrganizationsOrgIdMembers,
  postAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUser,
  postAdminRealmsRealmUsers,
  putAdminRealmsRealmUsersUserId,
} from '@/core/api/generated/keycloak';
import type { UserRepresentation } from '@/core/api/generated/keycloak';
import { getChannelType } from '@/core/api/generated/spring';
import { keycloakService } from '@/core/api/services/keycloak-service';
import { buildAccessInviteAttributes, parseAccessInviteRecord } from './attributes';
import { generateInviteToken } from './tokens';
import { accessValidationMiddleware } from './validation';
import type {
  AccessInviteCreateInput,
  AccessInviteMetadata,
  AccessInviteRecord,
  PartnerAccessMetadata,
} from './types';

interface CreateInviteOptions {
  expiresInMinutes?: number;
}

function generateInviteIdentifier() {
  return `acc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class AccessInviteFactory {
  private defaultExpiryMinutes = 60 * 24; // 24 hours

  async createInvite<T extends AccessInviteMetadata>(
    payload: AccessInviteCreateInput<T>,
    options?: CreateInviteOptions
  ): Promise<{
    record: AccessInviteRecord<T>;
    token: string;
  }> {
    const startTime = Date.now();
    console.log('[AccessInviteFactory] Creating invitation', {
      type: payload.type,
      email: payload.email,
      organizationId: payload.organizationId,
    });

    await accessValidationMiddleware.validate(payload);

    const realm = keycloakService.getRealm();
    const expiresAt = this.getExpiryTimestamp(options?.expiresInMinutes);
    const createdAt = new Date().toISOString();
    const inviteId = generateInviteIdentifier();

    console.log('[AccessInviteFactory] Ensuring user exists');
    const { user, isNewUser } = await this.ensureUser(realm, payload);
    const userId = user.id!;

    console.log('[AccessInviteFactory] Generating magic link token');
    const { token, tokenHash } = generateInviteToken({
      inviteId,
      organizationId: payload.organizationId,
      type: payload.type,
      userId,
      exp: Math.floor(new Date(expiresAt).getTime() / 1000),
    });

    // Build base invitation attributes
    const baseAttributes = buildAccessInviteAttributes(user, {
      inviteId,
      organizationId: payload.organizationId,
      type: payload.type,
      status: 'PENDING',
      metadata: payload.metadata,
      secretHash: tokenHash,
      createdAt,
      expiresAt,
    });

    // Fetch organization details for email template
    console.log('[AccessInviteFactory] Fetching organization details');
    const organization = await getAdminRealmsRealmOrganizationsOrgId(realm, payload.organizationId);

    // Validate organization exists - fail fast if not found
    if (!organization || !organization.id) {
      throw new Error(
        `Organization not found: ${payload.organizationId}. Please verify the organization exists in Keycloak.`
      );
    }

    // Build email template attributes
    console.log('[AccessInviteFactory] Building email template attributes');
    const emailAttributes = await this.buildEmailTemplateAttributes(
      payload.type,
      payload.organizationId,
      organization?.name,
      organization?.displayName,
      payload.metadata,
      token
    );

    // Merge all attributes
    const finalAttributes = {
      ...baseAttributes,
      ...emailAttributes,
    };

    console.log('[AccessInviteFactory] Updating user attributes');
    // Only update name for NEW users, not existing ones
    await putAdminRealmsRealmUsersUserId(realm, userId, {
      ...user,
      // Only set firstName/lastName if this is a new user
      ...(isNewUser && {
        firstName: payload.firstName,
        lastName: payload.lastName,
      }),
      attributes: finalAttributes,
    });

    console.log('[AccessInviteFactory] Ensuring organization membership');
    await this.ensureOrganizationMembership(realm, payload.organizationId, userId);

    console.log('[AccessInviteFactory] Dispatching Keycloak invitation email');
    await this.dispatchKeycloakInvite(realm, payload.organizationId, userId);

    const refreshedUser = await getAdminRealmsRealmUsersUserId(realm, userId);
    const record = parseAccessInviteRecord(refreshedUser);
    if (!record) {
      throw new Error('Failed to register access invitation attributes');
    }

    const duration = Date.now() - startTime;
    console.log('[AccessInviteFactory] ✓ Invitation created successfully', {
      inviteId,
      userId,
      email: payload.email,
      type: payload.type,
      organizationId: payload.organizationId,
      duration: `${duration}ms`,
    });

    return {
      record: record as AccessInviteRecord<T>,
      token,
    };
  }

  private getExpiryTimestamp(expiresInMinutes?: number) {
    const minutes = expiresInMinutes ?? this.defaultExpiryMinutes;
    return addMinutes(new Date(), minutes).toISOString();
  }

  private async ensureUser<T extends AccessInviteMetadata>(
    realm: string,
    payload: AccessInviteCreateInput<T>
  ): Promise<{ user: UserRepresentation; isNewUser: boolean }> {
    const existingUsers = await getAdminRealmsRealmUsers(realm, {
      email: payload.email,
      exact: true,
    });

    // If user already exists, return them WITHOUT modifying their name
    if (existingUsers.length > 0) {
      console.log('[AccessInviteFactory] User already exists:', {
        email: payload.email,
        existingFirstName: existingUsers[0].firstName,
        existingLastName: existingUsers[0].lastName,
      });
      return { user: existingUsers[0], isNewUser: false };
    }

    // Create new user with provided name
    const newUser: UserRepresentation = {
      email: payload.email,
      username: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      enabled: true,
      emailVerified: false,
    };

    console.log('[AccessInviteFactory] Creating new user:', {
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
    });

    await postAdminRealmsRealmUsers(realm, newUser);

    const createdUsers = await getAdminRealmsRealmUsers(realm, {
      email: payload.email,
      exact: true,
    });

    if (createdUsers.length === 0) {
      throw new Error('Failed to create user for invitation');
    }

    return { user: createdUsers[0], isNewUser: true };
  }

  private async ensureOrganizationMembership(
    realm: string,
    organizationId: string,
    userId: string
  ) {
    try {
      await postAdminRealmsRealmOrganizationsOrgIdMembers(realm, organizationId, userId);
    } catch (error: any) {
      if (error?.status !== 409) {
        throw error;
      }
    }
  }

  /**
   * Build email template attributes for Keycloakify templates
   * These attributes are used by executeActions.ftl to personalize invitation emails
   */
  private async buildEmailTemplateAttributes(
    type: 'user' | 'partner',
    organizationId: string,
    organizationName?: string,
    organizationDisplayName?: string,
    metadata?: AccessInviteMetadata,
    magicToken?: string,
    expiryHours?: number
  ): Promise<Record<string, string[]>> {
    // Calculate expiry hours from defaultExpiryMinutes if not provided
    const calculatedExpiryHours = expiryHours ?? Math.floor(this.defaultExpiryMinutes / 60);

    const attributes: Record<string, string[]> = {
      // Common attributes for all invitations
      user_type: [type],
      organization_id: [organizationId],
      organization_name: [organizationName || 'Organization'],
      organization_display_name: [organizationDisplayName || organizationName || 'Organization'],

      // Magic link token for custom onboarding flow
      magic_link_token: [magicToken || ''],
      custom_app_url: [process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || ''],

      // Expiry information for email template
      invitation_expiry_hours: [calculatedExpiryHours.toString()],
    };

    // Partner-specific attributes
    if (type === 'partner' && metadata) {
      const partnerMetadata = metadata as PartnerAccessMetadata;

      try {
        // Fetch channel type details from Spring backend
        const channelType = await getChannelType(partnerMetadata.channelType.id);

        attributes.channel_type_id = [partnerMetadata.channelType.id.toString()];
        attributes.channel_type_name = [channelType?.name || partnerMetadata.channelType.name || 'Business Partner'];

        if (channelType?.commissionRate !== undefined && channelType?.commissionRate !== null) {
          attributes.channel_type_commission_rate = [channelType.commissionRate.toString()];
        } else if (partnerMetadata.commissionPercent !== undefined) {
          attributes.channel_type_commission_rate = [partnerMetadata.commissionPercent.toString()];
        }
      } catch (error) {
        console.warn('Failed to fetch channel type details for email template:', error);
        // Fallback to metadata values
        attributes.channel_type_id = [partnerMetadata.channelType.id.toString()];
        attributes.channel_type_name = [partnerMetadata.channelType.name || 'Business Partner'];
        if (partnerMetadata.commissionPercent !== undefined) {
          attributes.channel_type_commission_rate = [partnerMetadata.commissionPercent.toString()];
        }
      }
    }

    return attributes;
  }

  private async dispatchKeycloakInvite(
    realm: string,
    organizationId: string,
    userId: string
  ) {
    await postAdminRealmsRealmOrganizationsOrgIdMembersInviteExistingUser(
      realm,
      organizationId,
      { id: userId }
    );
  }
}

export const accessInviteFactory = new AccessInviteFactory();
