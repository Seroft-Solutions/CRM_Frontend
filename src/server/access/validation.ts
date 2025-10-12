import { z } from 'zod';
import { keycloakService } from '@/core/api/services/keycloak-service';
import { getAdminRealmsRealmUsers } from '@/core/api/generated/keycloak';
import { parseAccessInviteRecord } from './attributes';
import type {
  AccessInviteCreateInput,
  AccessInviteMetadata,
  AccessInviteType,
} from './types';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const descriptorSchema = z.object({
  id: z.string().min(1),
  name: z.string().optional(),
});

const staffMetadataSchema = z.object({
  roles: z.array(descriptorSchema).optional(),
  groups: z.array(descriptorSchema).min(1, 'Select at least one group'),
  note: z.string().max(500).optional(),
});

const partnerMetadataSchema = z.object({
  channelType: z.object({
    id: z.number().int().positive(),
    name: z.string().optional(),
  }),
  commissionPercent: z.number().min(0).max(100).optional(),
  groups: z.array(descriptorSchema).optional(), // Business Partner group is auto-assigned by backend
  note: z.string().max(500).optional(),
});

const baseInviteSchema = z.object({
  type: z.union([z.literal('user'), z.literal('partner')]),
  organizationId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().regex(emailRegex, 'Enter a valid email'),
  metadata: z.unknown(),
});

export class AccessValidationMiddleware {
  async validate<T extends AccessInviteMetadata>(
    payload: AccessInviteCreateInput<T>,
    options?: { allowDuplicate?: boolean }
  ) {
    const result = baseInviteSchema.safeParse(payload);
    if (!result.success) {
      const message = result.error.errors[0]?.message ?? 'Invalid invite payload';
      throw new Error(message);
    }

    if (!options?.allowDuplicate) {
      await this.ensureNoDuplicate(payload);
    }

    this.validateMetadata(payload.type, payload.metadata);
  }

  private validateMetadata(type: AccessInviteType, metadata: AccessInviteMetadata) {
    if (type === 'user') {
      staffMetadataSchema.parse(metadata);
      return;
    }

    if (type === 'partner') {
      partnerMetadataSchema.parse(metadata);
      return;
    }

    throw new Error(`Unsupported invite type: ${type}`);
  }

  private async ensureNoDuplicate(payload: AccessInviteCreateInput<AccessInviteMetadata>) {
    const realm = keycloakService.getRealm();

    // NOTE: This check is susceptible to race conditions in high-concurrency scenarios.
    // Two simultaneous requests can both pass this check and create duplicate invitations.
    //
    // MITIGATION STRATEGIES:
    // 1. Idempotency key in request headers (recommended for production)
    // 2. Distributed lock (e.g., Redis) with key: `invite:${email}:${orgId}:${type}`
    // 3. Database-level unique constraint (requires moving invitation data from user attributes to dedicated table)
    //
    // Current implementation provides best-effort duplicate prevention for typical use cases.

    const users = await getAdminRealmsRealmUsers(realm, {
      email: payload.email,
      exact: true,
    });

    for (const user of users) {
      const invite = parseAccessInviteRecord(user);
      if (
        invite &&
        invite.organizationId === payload.organizationId &&
        invite.type === payload.type &&
        invite.status === 'PENDING'
      ) {
        throw new Error(
          `A pending ${payload.type} invitation already exists for ${payload.email} in this organization. Please wait for them to accept or cancel the existing invitation.`
        );
      }

      // Also check for recently ACCEPTED invitations (within last 5 minutes)
      // This prevents accidentally re-inviting someone who just joined
      if (
        invite &&
        invite.organizationId === payload.organizationId &&
        invite.type === payload.type &&
        invite.status === 'ACCEPTED' &&
        invite.joinedAt
      ) {
        const joinedTime = new Date(invite.joinedAt).getTime();
        const now = Date.now();
        const fiveMinutesInMs = 5 * 60 * 1000;

        if (now - joinedTime < fiveMinutesInMs) {
          throw new Error(
            `${payload.email} recently accepted an invitation to this organization. Please refresh your member list.`
          );
        }
      }
    }
  }
}

export const accessValidationMiddleware = new AccessValidationMiddleware();
