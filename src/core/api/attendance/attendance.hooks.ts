import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  QueryClient,
  QueryFunction,
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query';
import { springServiceMutator } from '@/core/api/services/spring-service/service-mutator';
import type {
  AttendanceLocationDTO,
  AttendanceRecordDTO,
  AttendanceRecordsParamsDTO,
  AttendanceTodayStatusDTO,
} from './attendance.dto';
import { attendanceQueryKeys } from './attendance.query-keys';

export const getMyTodayAttendance = (signal?: AbortSignal) =>
  springServiceMutator<AttendanceTodayStatusDTO>({
    url: '/api/attendance/my/today',
    method: 'GET',
    signal,
  });

export const getMyAttendanceHistory = (params?: AttendanceRecordsParamsDTO, signal?: AbortSignal) =>
  springServiceMutator<AttendanceRecordDTO[]>({
    url: '/api/attendance/my/history',
    method: 'GET',
    params,
    signal,
  });

export const getAdminAttendanceRecords = (
  params?: AttendanceRecordsParamsDTO,
  signal?: AbortSignal
) =>
  springServiceMutator<AttendanceRecordDTO[]>({
    url: '/api/attendance/admin/records',
    method: 'GET',
    params,
    signal,
  });

export const checkInAttendance = (payload: AttendanceLocationDTO) =>
  springServiceMutator<AttendanceRecordDTO>({
    url: '/api/attendance/check-in',
    method: 'POST',
    data: payload,
  });

export const checkOutAttendance = (payload: AttendanceLocationDTO) =>
  springServiceMutator<AttendanceRecordDTO>({
    url: '/api/attendance/check-out',
    method: 'POST',
    data: payload,
  });

export const useGetMyTodayAttendance = (
  options?: { query?: Partial<UseQueryOptions<AttendanceTodayStatusDTO, Error>> },
  queryClient?: QueryClient
): UseQueryResult<AttendanceTodayStatusDTO, Error> & { queryKey: QueryKey } => {
  const queryOptions = options?.query ?? {};
  const queryKey = queryOptions.queryKey ?? attendanceQueryKeys.today;
  const queryFn: QueryFunction<AttendanceTodayStatusDTO> = ({ signal }) =>
    getMyTodayAttendance(signal);

  const query = useQuery({ queryKey, queryFn, ...queryOptions }, queryClient) as UseQueryResult<
    AttendanceTodayStatusDTO,
    Error
  > & { queryKey: QueryKey };

  query.queryKey = queryKey;

  return query;
};

export const useGetMyAttendanceHistory = (
  params?: AttendanceRecordsParamsDTO,
  options?: { query?: Partial<UseQueryOptions<AttendanceRecordDTO[], Error>> },
  queryClient?: QueryClient
): UseQueryResult<AttendanceRecordDTO[], Error> & { queryKey: QueryKey } => {
  const queryOptions = options?.query ?? {};
  const queryKey = queryOptions.queryKey ?? attendanceQueryKeys.myHistory(params);
  const queryFn: QueryFunction<AttendanceRecordDTO[]> = ({ signal }) =>
    getMyAttendanceHistory(params, signal);

  const query = useQuery({ queryKey, queryFn, ...queryOptions }, queryClient) as UseQueryResult<
    AttendanceRecordDTO[],
    Error
  > & { queryKey: QueryKey };

  query.queryKey = queryKey;

  return query;
};

export const useGetAdminAttendanceRecords = (
  params?: AttendanceRecordsParamsDTO,
  options?: { query?: Partial<UseQueryOptions<AttendanceRecordDTO[], Error>> },
  queryClient?: QueryClient
): UseQueryResult<AttendanceRecordDTO[], Error> & { queryKey: QueryKey } => {
  const queryOptions = options?.query ?? {};
  const queryKey = queryOptions.queryKey ?? attendanceQueryKeys.adminRecords(params);
  const queryFn: QueryFunction<AttendanceRecordDTO[]> = ({ signal }) =>
    getAdminAttendanceRecords(params, signal);

  const query = useQuery({ queryKey, queryFn, ...queryOptions }, queryClient) as UseQueryResult<
    AttendanceRecordDTO[],
    Error
  > & { queryKey: QueryKey };

  query.queryKey = queryKey;

  return query;
};

export const useCheckInAttendance = (
  options?: UseMutationOptions<AttendanceRecordDTO, Error, AttendanceLocationDTO>
): UseMutationResult<AttendanceRecordDTO, Error, AttendanceLocationDTO> => {
  return useMutation({
    mutationFn: checkInAttendance,
    ...options,
  });
};

export const useCheckOutAttendance = (
  options?: UseMutationOptions<AttendanceRecordDTO, Error, AttendanceLocationDTO>
): UseMutationResult<AttendanceRecordDTO, Error, AttendanceLocationDTO> => {
  return useMutation({
    mutationFn: checkOutAttendance,
    ...options,
  });
};
