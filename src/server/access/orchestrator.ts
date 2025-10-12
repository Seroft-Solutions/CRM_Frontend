import {
  getAdminRealmsRealmUsersUserId,
  putAdminRealmsRealmUsersUserId,
} from '@/core/api/generated/keycloak';
import { keycloakService } from '@/core/api/services/keycloak-service';
import {
  clearAccessInviteAttributes,
  markAccessInviteAccepted,
  parseAccessInviteRecord,
} from './attributes';
import { partnerAccessStrategy, staffAccessStrategy } from './strategies';
import { parseInviteToken, validateTokenHash } from './tokens';
import type {
  AccessInviteAcceptanceResult,
  PartnerAccessMetadata,
  StaffAccessMetadata,
} from './types';

export class AccessOnboardingOrchestrator {
  async execute(token: string): Promise<AccessInviteAcceptanceResult> {
    // Generic error message to prevent information disclosure
    const GENERIC_ERROR = 'Invalid or expired invitation. Please request a new invitation link.';

    const { inviteId, userId, secret } = parseInviteToken(token);
    const realm = keycloakService.getRealm();

    let user;
    try {
      user = await getAdminRealmsRealmUsersUserId(realm, userId);
    } catch (error) {
      // User not found - use generic error to avoid user enumeration
      console.warn('[Orchestrator] User not found for token:', { userId });
      throw new Error(GENERIC_ERROR);
    }

    const inviteRecord = parseAccessInviteRecord(user);
    if (!inviteRecord) {
      console.warn('[Orchestrator] Invitation details missing:', { userId });
      throw new Error(GENERIC_ERROR);
    }

    if (inviteRecord.inviteId !== inviteId) {
      console.warn('[Orchestrator] Invitation ID mismatch:', { userId, inviteId });
      throw new Error(GENERIC_ERROR);
    }

    if (!inviteRecord.secretHash || !validateTokenHash(secret, inviteRecord.secretHash)) {
      console.warn('[Orchestrator] Invalid token hash:', { userId, inviteId });
      throw new Error(GENERIC_ERROR);
    }

    // These checks can have specific messages since they don't reveal security info
    if (inviteRecord.status !== 'PENDING') {
      throw new Error('This invitation has already been used. Please log in with your password.');
    }

    if (new Date(inviteRecord.expiresAt) < new Date()) {
      throw new Error('This invitation has expired. Please request a new invitation from your administrator.');
    }

    const strategyResult =
      inviteRecord.type === 'user'
        ? await staffAccessStrategy.execute({
            user,
            metadata: inviteRecord.metadata as StaffAccessMetadata,
            organizationId: inviteRecord.organizationId,
          })
        : await partnerAccessStrategy.execute({
            user,
            metadata: inviteRecord.metadata as PartnerAccessMetadata,
            organizationId: inviteRecord.organizationId,
          });

    const joinedAt = new Date().toISOString();
    const acceptedAttributes = markAccessInviteAccepted(
      { ...user, attributes: { ...(user.attributes ?? {}) } },
      joinedAt
    );
    const sanitizedAttributes = clearAccessInviteAttributes({
      ...user,
      attributes: acceptedAttributes,
    });

    await putAdminRealmsRealmUsersUserId(realm, userId, {
      ...user,
      emailVerified: true,
      attributes: sanitizedAttributes,
    });

    return {
      userId,
      invitationId: inviteRecord.inviteId,
      organizationId: inviteRecord.organizationId,
      status: 'ACCEPTED',
      emailVerified: true,
      appliedGroups: strategyResult.appliedGroups ?? [],
      appliedRoles: strategyResult.appliedRoles ?? [],
    };
  }
}

export const accessOnboardingOrchestrator = new AccessOnboardingOrchestrator();
