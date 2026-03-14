import type { AttendanceRecordsParamsDTO } from './attendance.dto';

export const attendanceQueryKeys = {
  today: ['/api/attendance/my/today'] as const,
  myHistory: (params?: AttendanceRecordsParamsDTO) =>
    ['/api/attendance/my/history', params] as const,
  adminRecords: (params?: AttendanceRecordsParamsDTO) =>
    ['/api/attendance/admin/records', params] as const,
};
