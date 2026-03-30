import type { AttendanceRecordsParamsDTO } from './attendance.dto';

export const attendanceQueryKeys = {
  today: ['/api/attendance/my/today'] as const,
  activeAppointment: ['/api/attendance/appointments/my/active'] as const,
  appointmentHistory: ['/api/attendance/appointments/my'] as const,
  adminAppointmentHistory: (params?: AttendanceRecordsParamsDTO) =>
    ['/api/attendance/appointments/admin', params] as const,
  myHistory: (params?: AttendanceRecordsParamsDTO) =>
    ['/api/attendance/my/history', params] as const,
  adminRecords: (params?: AttendanceRecordsParamsDTO) =>
    ['/api/attendance/admin/records', params] as const,
  adminUserRecords: (params?: AttendanceRecordsParamsDTO) =>
    ['/api/attendance/admin/user-records', params] as const,
};
