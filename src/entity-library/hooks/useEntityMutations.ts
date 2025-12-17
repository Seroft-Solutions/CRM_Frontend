import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

export const useEntityMutations = (queryKeyPrefix: string) => {
  const queryClient = useQueryClient();

  const invalidateQueries = useCallback(
    async () =>
      queryClient.invalidateQueries({
        predicate: (q) =>
          typeof q.queryKey?.[0] === 'string' &&
          (q.queryKey[0] as string).startsWith(queryKeyPrefix),
      }),
    [queryClient, queryKeyPrefix]
  );

  return { invalidateQueries };
};
