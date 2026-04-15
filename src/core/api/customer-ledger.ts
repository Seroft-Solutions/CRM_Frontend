import { useQuery } from '@tanstack/react-query';
import type {
  QueryClient,
  QueryFunction,
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';
import type { CustomerLedgerInfo } from './ledger-types';

export const getCustomerLedger = (id: number, signal?: AbortSignal) =>
  springServiceMutator<CustomerLedgerInfo>({
    url: `/api/customers/${id}/ledger`,
    method: 'GET',
    signal,
  });

export const useGetCustomerLedger = (
  id: number,
  options?: { query?: Partial<UseQueryOptions<CustomerLedgerInfo, Error>> },
  queryClient?: QueryClient
): UseQueryResult<CustomerLedgerInfo, Error> & { queryKey: QueryKey } => {
  const queryOptions = options?.query ?? {};
  const queryKey = queryOptions.queryKey ?? [`/api/customers/${id}/ledger`];
  const queryFn: QueryFunction<CustomerLedgerInfo> = ({ signal }) => getCustomerLedger(id, signal);

  const query = useQuery({ queryKey, queryFn, ...queryOptions }, queryClient) as UseQueryResult<
    CustomerLedgerInfo,
    Error
  > & { queryKey: QueryKey };

  query.queryKey = queryKey;

  return query;
};
