'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { manageSalesmanService } from '@/features/manage-salesman/services/manage-salesman.service';

const QUERY_KEYS = {
  manageSalesman: (organizationId: string) => ['manageSalesman', organizationId],
};

export function useManageSalesman(organizationId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.manageSalesman(organizationId),
    queryFn: () => manageSalesmanService.getManageSalesmanData(organizationId),
    enabled: Boolean(organizationId),
    staleTime: 0,
    refetchOnWindowFocus: true,
  });
}

export function useAssignSalesman(organizationId: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      action = 'assign',
      managerUserId,
      salesmanUserIds,
    }: {
      action?: 'assign' | 'unassign';
      managerUserId: string;
      salesmanUserIds: string[];
    }) =>
      manageSalesmanService.assignSalesmen({
        action,
        organizationId,
        managerUserId,
        salesmanUserIds,
      }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.manageSalesman(organizationId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to assign salesman');
    },
  });

  return {
    updateSalesmanAssignment: mutation.mutate,
    updateSalesmanAssignmentAsync: mutation.mutateAsync,
    isUpdatingSalesmanAssignment: mutation.isPending,
  };
}
