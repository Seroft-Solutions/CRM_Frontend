import type {
  UserRepresentation,
} from '@/core/api/generated/keycloak';
import type {
  AccessInviteMetadata,
  AccessInviteRecord,
  AccessInviteStatus,
  AccessInviteType,
  PartnerAccessMetadata,
  StaffAccessMetadata,
} from './types';

const ATTR_PREFIX = 'access_invite';

const ATTR_KEYS = {
  id: `${ATTR_PREFIX}_id`,
  type: `${ATTR_PREFIX}_type`,
  status: `${ATTR_PREFIX}_status`,
  secretHash: `${ATTR_PREFIX}_secret_hash`,
  metadata: `${ATTR_PREFIX}_metadata`,
  organizationId: `${ATTR_PREFIX}_organization_id`,
  createdAt: `${ATTR_PREFIX}_created_at`,
  expiresAt: `${ATTR_PREFIX}_expires_at`,
  joinedAt: `${ATTR_PREFIX}_joined_at`,
};

interface AccessAttributePayload {
  inviteId: string;
  organizationId: string;
  type: AccessInviteType;
  status: AccessInviteStatus;
  metadata: AccessInviteMetadata;
  secretHash: string;
  createdAt: string;
  expiresAt: string;
  joinedAt?: string;
}

const DEFAULT_STATUS: AccessInviteStatus = 'PENDING';

export function buildAccessInviteAttributes(
  user: UserRepresentation,
  payload: AccessAttributePayload
): Record<string, string[]> {
  const attributes = { ...(user.attributes ?? {}) };

  attributes[ATTR_KEYS.id] = [payload.inviteId];
  attributes[ATTR_KEYS.type] = [payload.type];
  attributes[ATTR_KEYS.status] = [payload.status];
  attributes[ATTR_KEYS.secretHash] = [payload.secretHash];
  attributes[ATTR_KEYS.organizationId] = [payload.organizationId];
  attributes[ATTR_KEYS.createdAt] = [payload.createdAt];
  attributes[ATTR_KEYS.expiresAt] = [payload.expiresAt];

  if (payload.joinedAt) {
    attributes[ATTR_KEYS.joinedAt] = [payload.joinedAt];
  } else {
    delete attributes[ATTR_KEYS.joinedAt];
  }

  attributes[ATTR_KEYS.metadata] = [
    JSON.stringify(payload.metadata),
  ];

  return attributes;
}

export function clearAccessInviteAttributes(
  user: UserRepresentation
): Record<string, string[]> {
  const attributes = { ...(user.attributes ?? {}) };
  delete attributes[ATTR_KEYS.secretHash];
  return attributes;
}

export function markAccessInviteAccepted(
  user: UserRepresentation,
  joinedAt: string
): Record<string, string[]> {
  const attributes = { ...(user.attributes ?? {}) };
  attributes[ATTR_KEYS.status] = ['ACCEPTED'];
  attributes[ATTR_KEYS.joinedAt] = [joinedAt];
  return attributes;
}

export function parseAccessInviteMetadata(
  type: AccessInviteType,
  raw: unknown
): AccessInviteMetadata | null {
  if (typeof raw !== 'string') return null;

  try {
    const parsed = JSON.parse(raw);

    if (type === 'user') {
      return parsed as StaffAccessMetadata;
    }

    return parsed as PartnerAccessMetadata;
  } catch {
    return null;
  }
}

export function parseAccessInviteRecord(
  user: UserRepresentation
): AccessInviteRecord | null {
  const attributes = user.attributes ?? {};
  const inviteId = attributes[ATTR_KEYS.id]?.[0];
  const type = attributes[ATTR_KEYS.type]?.[0] as AccessInviteType | undefined;
  const status = attributes[ATTR_KEYS.status]?.[0] as AccessInviteStatus | undefined;
  const metadataRaw = attributes[ATTR_KEYS.metadata]?.[0];
  const organizationId = attributes[ATTR_KEYS.organizationId]?.[0];
  const createdAt = attributes[ATTR_KEYS.createdAt]?.[0];
  const expiresAt = attributes[ATTR_KEYS.expiresAt]?.[0];
  const joinedAt = attributes[ATTR_KEYS.joinedAt]?.[0];
  const secretHash = attributes[ATTR_KEYS.secretHash]?.[0];

  if (!inviteId || !type || !organizationId || !createdAt || !expiresAt) {
    return null;
  }

  const metadata = parseAccessInviteMetadata(type, metadataRaw);
  if (!metadata) {
    return null;
  }

  return {
    inviteId,
    userId: user.id!,
    organizationId,
    type,
    status: status ?? DEFAULT_STATUS,
    metadata,
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email ?? '',
    createdAt,
    expiresAt,
    joinedAt,
    emailVerified: Boolean(user.emailVerified),
    secretHash,
  };
}
