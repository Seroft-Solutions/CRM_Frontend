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
  AttendanceAppointmentCheckInDTO,
  AttendanceAppointmentCheckOutDTO,
  AttendanceAppointmentDTO,
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

export const getMyActiveAttendanceAppointment = async (signal?: AbortSignal) => {
  const response = await springServiceMutator<AttendanceAppointmentDTO | null | undefined>(
    {
      url: '/api/attendance/appointments/my/active',
      method: 'GET',
      signal,
    },
    {
      validateStatus: (status) => status === 200 || status === 204,
    }
  );

  return response ?? null;
};

export const getMyAttendanceAppointments = (signal?: AbortSignal) =>
  springServiceMutator<AttendanceAppointmentDTO[]>({
    url: '/api/attendance/appointments/my',
    method: 'GET',
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

export const getAdminAttendanceAppointments = (
  params?: AttendanceRecordsParamsDTO,
  signal?: AbortSignal
) =>
  springServiceMutator<AttendanceAppointmentDTO[]>({
    url: '/api/attendance/appointments/admin',
    method: 'GET',
    params,
    signal,
  });

export const getAdminUserAttendanceRecords = (
  params?: AttendanceRecordsParamsDTO,
  signal?: AbortSignal
) =>
  springServiceMutator<AttendanceRecordDTO[]>({
    url: '/api/attendance/admin/user-records',
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

export const checkInAttendanceAppointment = (payload: AttendanceAppointmentCheckInDTO) =>
  springServiceMutator<AttendanceAppointmentDTO>({
    url: '/api/attendance/appointments/check-in',
    method: 'POST',
    data: payload,
  });

export const checkOutAttendanceAppointment = (payload: AttendanceAppointmentCheckOutDTO) => {
  const formData = new FormData();

  formData.append('latitude', String(payload.latitude));
  formData.append('longitude', String(payload.longitude));
  if (typeof payload.accuracy === 'number') {
    formData.append('accuracy', String(payload.accuracy));
  }
  if (payload.source) {
    formData.append('source', payload.source);
  }
  formData.append('remark', payload.remark);
  formData.append('photo', payload.photo);

  return springServiceMutator<AttendanceAppointmentDTO>({
    url: '/api/attendance/appointments/check-out',
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    data: formData,
  });
};

export const markLeaveAttendance = () =>
  springServiceMutator<AttendanceRecordDTO>({
    url: '/api/attendance/leave',
    method: 'POST',
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

export const useGetMyActiveAttendanceAppointment = (
  options?: { query?: Partial<UseQueryOptions<AttendanceAppointmentDTO | null, Error>> },
  queryClient?: QueryClient
): UseQueryResult<AttendanceAppointmentDTO | null, Error> & { queryKey: QueryKey } => {
  const queryOptions = options?.query ?? {};
  const queryKey = queryOptions.queryKey ?? attendanceQueryKeys.activeAppointment;
  const queryFn: QueryFunction<AttendanceAppointmentDTO | null> = ({ signal }) =>
    getMyActiveAttendanceAppointment(signal);

  const query = useQuery({ queryKey, queryFn, ...queryOptions }, queryClient) as UseQueryResult<
    AttendanceAppointmentDTO | null,
    Error
  > & { queryKey: QueryKey };

  query.queryKey = queryKey;

  return query;
};

export const useGetMyAttendanceAppointments = (
  options?: { query?: Partial<UseQueryOptions<AttendanceAppointmentDTO[], Error>> },
  queryClient?: QueryClient
): UseQueryResult<AttendanceAppointmentDTO[], Error> & { queryKey: QueryKey } => {
  const queryOptions = options?.query ?? {};
  const queryKey = queryOptions.queryKey ?? attendanceQueryKeys.appointmentHistory;
  const queryFn: QueryFunction<AttendanceAppointmentDTO[]> = ({ signal }) =>
    getMyAttendanceAppointments(signal);

  const query = useQuery({ queryKey, queryFn, ...queryOptions }, queryClient) as UseQueryResult<
    AttendanceAppointmentDTO[],
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

export const useGetAdminAttendanceAppointments = (
  params?: AttendanceRecordsParamsDTO,
  options?: { query?: Partial<UseQueryOptions<AttendanceAppointmentDTO[], Error>> },
  queryClient?: QueryClient
): UseQueryResult<AttendanceAppointmentDTO[], Error> & { queryKey: QueryKey } => {
  const queryOptions = options?.query ?? {};
  const queryKey = queryOptions.queryKey ?? attendanceQueryKeys.adminAppointmentHistory(params);
  const queryFn: QueryFunction<AttendanceAppointmentDTO[]> = ({ signal }) =>
    getAdminAttendanceAppointments(params, signal);

  const query = useQuery({ queryKey, queryFn, ...queryOptions }, queryClient) as UseQueryResult<
    AttendanceAppointmentDTO[],
    Error
  > & { queryKey: QueryKey };

  query.queryKey = queryKey;

  return query;
};

export const useGetAdminUserAttendanceRecords = (
  params?: AttendanceRecordsParamsDTO,
  options?: { query?: Partial<UseQueryOptions<AttendanceRecordDTO[], Error>> },
  queryClient?: QueryClient
): UseQueryResult<AttendanceRecordDTO[], Error> & { queryKey: QueryKey } => {
  const queryOptions = options?.query ?? {};
  const queryKey = queryOptions.queryKey ?? attendanceQueryKeys.adminUserRecords(params);
  const queryFn: QueryFunction<AttendanceRecordDTO[]> = ({ signal }) =>
    getAdminUserAttendanceRecords(params, signal);

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

export const useCheckInAttendanceAppointment = (
  options?: UseMutationOptions<AttendanceAppointmentDTO, Error, AttendanceAppointmentCheckInDTO>
): UseMutationResult<AttendanceAppointmentDTO, Error, AttendanceAppointmentCheckInDTO> => {
  return useMutation({
    mutationFn: checkInAttendanceAppointment,
    ...options,
  });
};

export const useCheckOutAttendanceAppointment = (
  options?: UseMutationOptions<AttendanceAppointmentDTO, Error, AttendanceAppointmentCheckOutDTO>
): UseMutationResult<AttendanceAppointmentDTO, Error, AttendanceAppointmentCheckOutDTO> => {
  return useMutation({
    mutationFn: checkOutAttendanceAppointment,
    ...options,
  });
};

export const useMarkLeaveAttendance = (
  options?: UseMutationOptions<AttendanceRecordDTO, Error, void>
): UseMutationResult<AttendanceRecordDTO, Error, void> => {
  return useMutation({
    mutationFn: markLeaveAttendance,
    ...options,
  });
};
