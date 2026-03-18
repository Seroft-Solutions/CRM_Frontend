'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRBAC } from '@/core/auth';
import { useGetAdminUserAttendanceRecords, useGetMyAttendanceHistory } from '@/core/api/attendance';
import {
  AttendanceSubpageHeader,
  AttendanceWeekListCard,
  getDefaultWeeklyFromDateValue,
  getLocalDateInputValue,
} from '../components';

export default function AttendanceDetailsPage() {
  const searchParams = useSearchParams();
  const { isAdmin, hasGroup } = useRBAC();
  const adminAccess = isAdmin() || hasGroup('Admins') || hasGroup('Super Admins');
  const requestedUserId = searchParams.get('userId') || '';
  const requestedUserName = searchParams.get('userName') || '';
  const [fromDate, setFromDate] = useState<string>(
    searchParams.get('fromDate') || searchParams.get('listFromDate') || getDefaultWeeklyFromDateValue()
  );
  const [toDate, setToDate] = useState<string>(
    searchParams.get('toDate') || searchParams.get('listToDate') || getLocalDateInputValue()
  );

  const selfHistoryParams = useMemo(
    () => ({
      fromDate,
      toDate,
      size: 200,
      sort: ['attendanceDate,desc', 'checkInTime,desc'],
    }),
    [fromDate, toDate]
  );

  const adminHistoryParams = useMemo(
    () => ({
      userId: requestedUserId,
      fromDate,
      toDate,
      size: 200,
      sort: ['attendanceDate,desc', 'checkInTime,desc'],
    }),
    [fromDate, requestedUserId, toDate]
  );

  const selfHistoryQuery = useGetMyAttendanceHistory(selfHistoryParams, {
    query: { enabled: !requestedUserId },
  });
  const adminHistoryQuery = useGetAdminUserAttendanceRecords(adminHistoryParams, {
    query: { enabled: adminAccess && !!requestedUserId },
  });

  const rows = requestedUserId ? (adminHistoryQuery.data ?? []) : (selfHistoryQuery.data ?? []);
  const isLoading = requestedUserId ? adminHistoryQuery.isLoading : selfHistoryQuery.isLoading;

  return (
    <div className="space-y-6">
      <AttendanceSubpageHeader
        title={
          requestedUserId
            ? `${requestedUserName || requestedUserId} Weekly Attendance`
            : 'My Weekly Attendance'
        }
        description="Browse attendance grouped by week and open the detailed time-worked view for each week."
        backHref="/attendance"
        backLabel="Back to Attendance"
      />

      <AttendanceWeekListCard
        title="Weekly Attendance List"
        description="Attendance grouped into weekly summaries for the selected date range."
        rows={rows}
        isLoading={isLoading}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        getWeekHref={(weekId, weekFromDate, weekToDate) => {
          const params = new URLSearchParams({
            weekId,
            fromDate: weekFromDate,
            toDate: weekToDate,
            listFromDate: fromDate,
            listToDate: toDate,
          });

          if (requestedUserId) {
            params.set('userId', requestedUserId);
          }

          if (requestedUserName) {
            params.set('userName', requestedUserName);
          }

          return `/attendance/week-detail?${params.toString()}`;
        }}
      />
    </div>
  );
}
