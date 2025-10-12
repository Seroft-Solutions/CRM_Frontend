import { keycloakService } from '@/core/api/services/keycloak-service';
import { getAdminRealmsRealmUsers } from '@/core/api/generated/keycloak';
import { accessInviteFactory } from './factory';
import { accessOnboardingOrchestrator } from './orchestrator';
import { parseAccessInviteRecord } from './attributes';
import type {
  AccessInviteCreateInput,
  AccessInviteListResponse,
  AccessInviteMetadata,
  AccessInviteRecord,
  AccessInviteType,
} from './types';

export class AccessInviteService {
  async createInvite<T extends AccessInviteMetadata>(input: AccessInviteCreateInput<T>) {
    const { record, token } = await accessInviteFactory.createInvite(input);
    const { secretHash, ...sanitized } = record;
    return { record: sanitized as AccessInviteRecord<T>, token };
  }

  async listInvites<T extends AccessInviteMetadata>({
    type,
    organizationId,
    page = 1,
    size = 20,
    search,
  }: {
    type: AccessInviteType;
    organizationId: string;
    page?: number;
    size?: number;
    search?: string;
  }): Promise<AccessInviteListResponse<T>> {
    const realm = keycloakService.getRealm();
    const users = await getAdminRealmsRealmUsers(realm, {
      first: 0,
      max: 1000,
    });

    const records = users
      .map(parseAccessInviteRecord)
      .filter(
        (invite): invite is AccessInviteRecord =>
          Boolean(invite) &&
          invite.organizationId === organizationId &&
          invite.type === type
      );

    const filtered = (search
      ? records.filter((invite) => {
          const haystack = `${invite.firstName} ${invite.lastName} ${invite.email}`.toLowerCase();
          return haystack.includes(search.toLowerCase());
        })
      : records).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalCount = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / size));
    const start = (page - 1) * size;
    const invitations = filtered.slice(start, start + size).map(({ secretHash, ...rest }) => rest);

    return {
      invitations: invitations as AccessInviteRecord<T>[],
      totalCount,
      currentPage: page,
      totalPages,
    };
  }

  async acceptInvite(token: string) {
    return accessOnboardingOrchestrator.execute(token);
  }
}

export const accessInviteService = new AccessInviteService();
