import type {
  AccessInviteMetadata,
  AccessInviteRecord,
  AccessInviteStatus,
  AccessInviteType,
  PartnerAccessMetadata,
  StaffAccessMetadata,
} from '@/server/access/types';

export type {
  AccessInviteMetadata,
  AccessInviteRecord,
  AccessInviteStatus,
  AccessInviteType,
  PartnerAccessMetadata,
  StaffAccessMetadata,
} from '@/server/access/types';

export interface AccessInviteFormValues {
  firstName: string;
  lastName: string;
  email: string;
  metadata: AccessInviteMetadata;
}
