import { useQuery } from '@tanstack/react-query';
import type {
  QueryClient,
  QueryFunction,
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';
import type { SundryLedgerInfo } from './ledger-types';

export const getSundryLedger = (id: number, signal?: AbortSignal) =>
  springServiceMutator<SundryLedgerInfo>({
    url: `/api/sundry-creditors/${id}/ledger`,
    method: 'GET',
    signal,
  });

export const useGetSundryLedger = (
  id: number,
  options?: { query?: Partial<UseQueryOptions<SundryLedgerInfo, Error>> },
  queryClient?: QueryClient
): UseQueryResult<SundryLedgerInfo, Error> & { queryKey: QueryKey } => {
  const queryOptions = options?.query ?? {};
  const queryKey = queryOptions.queryKey ?? [`/api/sundry-creditors/${id}/ledger`];
  const queryFn: QueryFunction<SundryLedgerInfo> = ({ signal }) => getSundryLedger(id, signal);

  const query = useQuery({ queryKey, queryFn, ...queryOptions }, queryClient) as UseQueryResult<
    SundryLedgerInfo,
    Error
  > & { queryKey: QueryKey };

  query.queryKey = queryKey;

  return query;
};
