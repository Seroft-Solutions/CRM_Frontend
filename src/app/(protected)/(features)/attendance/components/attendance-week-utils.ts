import {
  addDays,
  endOfISOWeek,
  format,
  getISOWeek,
  getISOWeekYear,
  parseISO,
  startOfISOWeek,
  subWeeks,
} from 'date-fns';
import type { AttendanceRecordDTO } from '@/core/api/attendance';

export const WEEKLY_LIST_PAGE_SIZE = 8;

export type AttendanceWeekStatus =
  | 'ACTIVE'
  | 'CHECKED_OUT'
  | 'LEAVE'
  | 'INCOMPLETE';

export type AttendanceWeekSummary = {
  weekId: string;
  fromDate: string;
  toDate: string;
  totalMinutes: number;
  status: AttendanceWeekStatus;
  daysWorked: number;
  records: AttendanceRecordDTO[];
};

export type AttendanceWeekDay = {
  date: Date;
  key: string;
  label: string;
  displayDate: string;
};

function isValidDateValue(value?: string | null): value is string {
  if (!value) {
    return false;
  }

  return !Number.isNaN(new Date(value).getTime());
}

export function getWorkingMinutes(record?: AttendanceRecordDTO | null): number {
  if (!record?.checkInTime || !record.checkOutTime) {
    return 0;
  }

  const startedAt = new Date(record.checkInTime).getTime();
  const endedAt = new Date(record.checkOutTime).getTime();

  if (Number.isNaN(startedAt) || Number.isNaN(endedAt) || endedAt <= startedAt) {
    return 0;
  }

  return (endedAt - startedAt) / 60000;
}

export function formatHoursDecimal(totalMinutes?: number | null): string {
  if (
    totalMinutes === undefined ||
    totalMinutes === null ||
    !Number.isFinite(totalMinutes) ||
    totalMinutes <= 0
  ) {
    return '0.00';
  }

  return (totalMinutes / 60).toFixed(2);
}

export function getLocalDateInputValue(date: Date = new Date()): string {
  const timezoneOffset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

export function getDefaultWeeklyFromDateValue(date: Date = new Date()): string {
  return format(startOfISOWeek(subWeeks(date, 11)), 'yyyy-MM-dd');
}

export function getWeekIdFromAttendanceDate(attendanceDate: string): string {
  const parsedDate = parseISO(attendanceDate);
  const weekYear = getISOWeekYear(parsedDate);
  const weekNumber = getISOWeek(parsedDate);

  return `WK-${weekYear}-W${String(weekNumber).padStart(2, '0')}`;
}

export function deriveWeekStatus(records: AttendanceRecordDTO[]): AttendanceWeekStatus {
  if (
    records.some(
      (record) =>
        record.status === 'CHECKED_IN_OFFICE' ||
        record.status === 'CHECKED_IN_WORK_FROM_HOME'
    )
  ) {
    return 'ACTIVE';
  }

  if (records.length > 0 && records.every((record) => record.status === 'CHECKED_OUT')) {
    return 'CHECKED_OUT';
  }

  if (records.some((record) => record.status === 'LEAVE')) {
    return 'LEAVE';
  }

  return 'INCOMPLETE';
}

export function buildAttendanceWeekSummaries(
  records: AttendanceRecordDTO[]
): AttendanceWeekSummary[] {
  const groupedWeeks = new Map<string, AttendanceRecordDTO[]>();

  records.forEach((record) => {
    if (!record.attendanceDate) {
      return;
    }

    const weekId = getWeekIdFromAttendanceDate(record.attendanceDate);
    const weekRecords = groupedWeeks.get(weekId) ?? [];

    weekRecords.push(record);
    groupedWeeks.set(weekId, weekRecords);
  });

  return Array.from(groupedWeeks.entries())
    .map(([weekId, weekRecords]) => {
      const sortedRecords = [...weekRecords].sort((left, right) =>
        left.attendanceDate.localeCompare(right.attendanceDate)
      );
      const totalMinutes = sortedRecords.reduce(
        (sum, record) => sum + getWorkingMinutes(record),
        0
      );

      return {
        weekId,
        fromDate: sortedRecords[0]?.attendanceDate ?? '',
        toDate: sortedRecords[sortedRecords.length - 1]?.attendanceDate ?? '',
        totalMinutes,
        status: deriveWeekStatus(sortedRecords),
        daysWorked: sortedRecords.filter((record) => !!record.checkInTime).length,
        records: sortedRecords,
      };
    })
    .sort((left, right) => right.fromDate.localeCompare(left.fromDate));
}

export function formatWeekPeriod(fromDate: string, toDate: string): string {
  if (!fromDate || !toDate) {
    return 'N/A';
  }

  const from = parseISO(fromDate);
  const to = parseISO(toDate);

  return `${format(from, 'MM/dd/yyyy')} - ${format(to, 'MM/dd/yyyy')}`;
}

export function formatWeekPeriodLong(fromDate: string, toDate: string): string {
  if (!fromDate || !toDate) {
    return 'N/A';
  }

  const from = parseISO(fromDate);
  const to = parseISO(toDate);

  return `${format(from, 'MMM dd, yyyy')} - ${format(to, 'MMM dd, yyyy')}`;
}

export function buildWeekDays(fromDate: string): AttendanceWeekDay[] {
  if (!fromDate) {
    return [];
  }

  const weekStart = startOfISOWeek(parseISO(fromDate));

  return Array.from({ length: 6 }, (_, index) => {
    const day = addDays(weekStart, index);

    return {
      date: day,
      key: format(day, 'yyyy-MM-dd'),
      label: format(day, 'EEE'),
      displayDate: format(day, 'M/dd'),
    };
  });
}

export function getWeekBoundaryDates(fromDate: string): {
  weekStartDate: string;
  weekEndDate: string;
} {
  const parsedDate = parseISO(fromDate);

  return {
    weekStartDate: format(startOfISOWeek(parsedDate), 'yyyy-MM-dd'),
    weekEndDate: format(endOfISOWeek(parsedDate), 'yyyy-MM-dd'),
  };
}

export function getPrimaryWeekRecord(
  records: AttendanceRecordDTO[]
): AttendanceRecordDTO | null {
  return (
    records.find(
      (record) => record.userDisplayName || record.userLogin || record.userEmail || record.checkInSource
    ) ??
    records[0] ??
    null
  );
}

export function getWeekSourceLabel(records: AttendanceRecordDTO[]): string {
  const uniqueSources = Array.from(
    new Set(records.map((record) => record.checkInSource).filter(Boolean))
  );

  return uniqueSources.length > 0 ? uniqueSources.join(', ') : 'N/A';
}

export function getWeekModeBreakdown(records: AttendanceRecordDTO[]): string {
  const officeCount = records.filter((record) => record.checkInMode === 'OFFICE').length;
  const workFromHomeCount = records.filter(
    (record) => record.checkInMode === 'WORK_FROM_HOME'
  ).length;
  const leaveCount = records.filter((record) => record.checkInMode === 'LEAVE').length;

  return `${officeCount}× OFFICE, ${workFromHomeCount}× WORK_FROM_HOME, ${leaveCount}× LEAVE`;
}

export function getRelatedAttendanceDates(records: AttendanceRecordDTO[]): string[] {
  return records
    .map((record) => record.attendanceDate)
    .filter((attendanceDate): attendanceDate is string => !!attendanceDate)
    .sort((left, right) => left.localeCompare(right));
}

export function getHoursForDay(record?: AttendanceRecordDTO | null): string {
  return formatHoursDecimal(getWorkingMinutes(record));
}

export function getHoursForMode(
  record: AttendanceRecordDTO | undefined,
  mode: 'OFFICE' | 'WORK_FROM_HOME' | 'LEAVE'
): string {
  if (!record || record.checkInMode !== mode) {
    return '—';
  }

  const workingMinutes = getWorkingMinutes(record);

  if (workingMinutes <= 0) {
    return '—';
  }

  return formatHoursDecimal(workingMinutes);
}

export function hasAnyValidTime(records: AttendanceRecordDTO[]): boolean {
  return records.some((record) => isValidDateValue(record.checkInTime) || isValidDateValue(record.checkOutTime));
}
