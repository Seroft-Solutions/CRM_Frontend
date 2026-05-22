'use client';

import { useMemo } from 'react';
import { useAccount } from '@/core/auth';
import { useOrganizationContext, useOrganizationUsers } from '@/features/user-management/hooks';
import type { OrganizationUser } from '@/features/user-management/types';

const normalizeGroupName = (name?: string) => (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

function hasAssignedGroup(user: OrganizationUser | undefined, names: string[]) {
  const normalizedNames = new Set(names.map(normalizeGroupName));

  return (user?.assignedGroups || []).some((group: { name?: string }) =>
    normalizedNames.has(normalizeGroupName(group.name))
  );
}

export function useCurrentUserPickPackGroups() {
  const { data: accountData } = useAccount();
  const { organizationId } = useOrganizationContext();
  const { users: organizationMembers, isLoading } = useOrganizationUsers(organizationId, {
    page: 1,
    size: 1000,
    sortBy: 'user',
    sortDirection: 'asc',
  });

  const currentOrganizationUser = useMemo(
    () =>
      (organizationMembers || []).find((user: OrganizationUser) => {
        const accountId = accountData?.id != null ? String(accountData.id) : '';
        const accountLogin = accountData?.login?.toLowerCase?.() || '';

        return (
          (accountId && user.id === accountId) ||
          (accountLogin &&
            (user.username?.toLowerCase?.() === accountLogin ||
              user.email?.toLowerCase?.() === accountLogin))
        );
      }),
    [accountData?.id, accountData?.login, organizationMembers]
  );

  const isPickerUser = useMemo(
    () => hasAssignedGroup(currentOrganizationUser, ['picker', 'pickers']),
    [currentOrganizationUser]
  );
  const isPackerUser = useMemo(
    () => hasAssignedGroup(currentOrganizationUser, ['packer', 'packers']),
    [currentOrganizationUser]
  );

  return {
    currentOrganizationUser,
    isLoading,
    isPickerUser,
    isPackerUser,
    isPickerPackerUser: isPickerUser || isPackerUser,
  };
}
