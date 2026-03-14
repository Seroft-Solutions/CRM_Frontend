export type AttendanceLocationDTO = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  source?: string;
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
  status: 'NOT_CHECKED_IN' | 'CHECKED_IN' | 'CHECKED_OUT' | string;
};

export type AttendanceTodayStatusDTO = {
  checkedIn: boolean;
  checkedOut: boolean;
  attendance: AttendanceRecordDTO | null;
};

export type AttendanceRecordsParamsDTO = {
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
  sort?: string[];
};
