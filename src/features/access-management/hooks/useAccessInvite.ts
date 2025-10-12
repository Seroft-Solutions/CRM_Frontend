'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import type {
  AccessInviteMetadata,
  AccessInviteRecord,
  AccessInviteType,
} from '@/features/access-management/types';
import { toast } from 'sonner';

interface CreateInvitePayload<T extends AccessInviteMetadata> {
  type: AccessInviteType;
  firstName: string;
  lastName: string;
  email: string;
  metadata: T;
  organizationId: string;
}

interface CreateInviteResponse<T extends AccessInviteMetadata> {
  invitation: AccessInviteRecord<T>;
  token: string;
}

interface UseAccessInvitesOptions {
  organizationId: string;
  type: AccessInviteType;
  search?: string;
  page?: number;
  size?: number;
}

export function useAccessInvite<T extends AccessInviteMetadata>() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (payload: CreateInvitePayload<T>) => {
      const response = await fetch('/api/access/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to send invitation');
      }

      return (await response.json()) as CreateInviteResponse<T>;
    },
    onSuccess: (result, variables) => {
      toast.success(`Invitation sent to ${variables.email}`);
      queryClient.invalidateQueries({
        queryKey: ['access-invitations', variables.type, variables.organizationId],
        exact: false,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    sendInvite: mutation.mutate,
    sendInviteAsync: mutation.mutateAsync,
    isInviting: mutation.isPending,
    error: mutation.error,
  };
}

export function useAccessInvitations<T extends AccessInviteMetadata>({
  organizationId,
  type,
  search,
  page = 1,
  size = 10,
}: UseAccessInvitesOptions) {
  const query = useQuery({
    queryKey: ['access-invitations', type, organizationId, page, size, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        organizationId,
        page: page.toString(),
        size: size.toString(),
      });
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/access/invitations/${type}?${params.toString()}`);
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error || 'Failed to fetch invitations');
      }
      return response.json() as Promise<{
        invitations: AccessInviteRecord<T>[];
        totalCount: number;
        totalPages: number;
        currentPage: number;
      }>;
    },
  });

  return useMemo(
    () => ({
      invitations: query.data?.invitations ?? [],
      totalCount: query.data?.totalCount ?? 0,
      currentPage: query.data?.currentPage ?? 1,
      totalPages: query.data?.totalPages ?? 1,
      isLoading: query.isLoading,
      error: query.error,
      refetch: query.refetch,
    }),
    [query],
  );
}
