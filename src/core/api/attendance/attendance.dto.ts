export type AttendanceLocationDTO = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source?: string;
  workFromHome?: boolean;
};

export type AttendanceAppointmentCheckInDTO = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source?: string;
  leadId: number;
  orderId: number;
};

export type AttendanceAppointmentCheckOutDTO = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source?: string;
  remark: string;
  photo: File;
};

export type AttendanceAppointmentDTO = {
  id: number;
  appointmentDate: string;
  userId: string;
  userLogin: string;
  userEmail?: string | null;
  userDisplayName?: string | null;
  leadId: number;
  leadNo: string;
  orderId: number;
  checkInTime?: string | null;
  checkInLatitude?: number | null;
  checkInLongitude?: number | null;
  checkInAccuracy?: number | null;
  checkInSource?: string | null;
  checkOutTime?: string | null;
  checkOutLatitude?: number | null;
  checkOutLongitude?: number | null;
  checkOutAccuracy?: number | null;
  checkOutSource?: string | null;
  checkOutRemark?: string | null;
  checkOutPhotoAvailable?: boolean | null;
  status: 'CHECKED_IN' | 'CHECKED_OUT' | string;
};

export type AttendanceRecordDTO = {
  id: number;
  attendanceDate: string;
  userId: string;
  userLogin: string;
  userEmail?: string | null;
  userDisplayName?: string | null;
  checkInTime?: string | null;
  checkInLatitude?: number | null;
  checkInLongitude?: number | null;
  checkInAccuracy?: number | null;
  checkInSource?: string | null;
  checkOutTime?: string | null;
  checkOutLatitude?: number | null;
  checkOutLongitude?: number | null;
  checkOutAccuracy?: number | null;
  checkOutSource?: string | null;
  checkInMode?: 'OFFICE' | 'WORK_FROM_HOME' | string | null;
  status:
    | 'LEAVE'
    | 'NOT_CHECKED_IN'
    | 'CHECKED_IN_OFFICE'
    | 'CHECKED_IN_WORK_FROM_HOME'
    | 'CHECKED_OUT'
    | string;
};

export type AttendanceTodayStatusDTO = {
  checkedIn: boolean;
  checkedOut: boolean;
  attendance: AttendanceRecordDTO | null;
};

export type AttendanceRecordsParamsDTO = {
  userId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string[];
};
