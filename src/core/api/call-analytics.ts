import { useQuery } from '@tanstack/react-query';
import type {
  QueryClient,
  QueryFunction,
  QueryKey,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';

export type CallStaffLeadSummaryDTO = {
  createdBy: string;
  total: number;
  active: number;
  inactive: number;
};

export type StaffLeadSummaryPeriod = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export type GetStaffLeadSummaryParams = {
  period: StaffLeadSummaryPeriod;
  createdBy?: string;
};

export const getStaffLeadSummary = (
  params: GetStaffLeadSummaryParams,
  signal?: AbortSignal
) =>
  springServiceMutator<CallStaffLeadSummaryDTO[]>({
    url: '/api/calls/staff-lead-summary',
    method: 'GET',
    params,
    signal,
  });

export const useGetStaffLeadSummary = (
  params: GetStaffLeadSummaryParams,
  options?: { query?: Partial<UseQueryOptions<CallStaffLeadSummaryDTO[], Error>> },
  queryClient?: QueryClient
): UseQueryResult<CallStaffLeadSummaryDTO[], Error> & { queryKey: QueryKey } => {
  const queryOptions = options?.query ?? {};
  const queryKey = queryOptions.queryKey ?? ['/api/calls/staff-lead-summary', params];
  const queryFn: QueryFunction<CallStaffLeadSummaryDTO[]> = ({ signal }) =>
    getStaffLeadSummary(params, signal);

  const query = useQuery({ queryKey, queryFn, ...queryOptions }, queryClient) as UseQueryResult<
    CallStaffLeadSummaryDTO[],
    Error
  > & { queryKey: QueryKey };

  query.queryKey = queryKey;
  return query;
};
