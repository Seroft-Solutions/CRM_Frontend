'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRBAC } from '@/core/auth';
import {
  useGetAdminUserAttendanceRecords,
  useGetMyAttendanceHistory,
} from '@/core/api/attendance';
import {
  AttendanceLoadingRow,
  AttendanceSubpageHeader,
  AttendanceWeekDetailCard,
} from '../components';

export default function AttendanceWeekDetailPage() {
  const searchParams = useSearchParams();
  const { isAdmin, hasGroup } = useRBAC();
  const adminAccess = isAdmin() || hasGroup('Admins') || hasGroup('Super Admins');
  const weekId = searchParams.get('weekId') || '';
  const fromDate = searchParams.get('fromDate') || '';
  const toDate = searchParams.get('toDate') || '';
  const listFromDate = searchParams.get('listFromDate') || fromDate;
  const listToDate = searchParams.get('listToDate') || toDate;
  const requestedUserId = searchParams.get('userId') || '';
  const requestedUserName = searchParams.get('userName') || '';

  const selfParams = useMemo(
    () => ({
      fromDate,
      toDate,
      size: 31,
      sort: ['attendanceDate,asc', 'checkInTime,asc'],
    }),
    [fromDate, toDate]
  );

  const adminParams = useMemo(
    () => ({
      userId: requestedUserId,
      fromDate,
      toDate,
      size: 31,
      sort: ['attendanceDate,asc', 'checkInTime,asc'],
    }),
    [fromDate, requestedUserId, toDate]
  );

  const selfHistoryQuery = useGetMyAttendanceHistory(selfParams, {
    query: { enabled: !requestedUserId && !!fromDate && !!toDate },
  });
  const adminHistoryQuery = useGetAdminUserAttendanceRecords(adminParams, {
    query: { enabled: adminAccess && !!requestedUserId && !!fromDate && !!toDate },
  });

  const rows = requestedUserId
    ? adminHistoryQuery.data ?? []
    : selfHistoryQuery.data ?? [];
  const isLoading = requestedUserId
    ? adminHistoryQuery.isLoading
    : selfHistoryQuery.isLoading;

  const backHref = useMemo(() => {
    if (!requestedUserId) {
      return '/attendance';
    }

    const params = new URLSearchParams({
      userId: requestedUserId,
      fromDate: listFromDate,
      toDate: listToDate,
    });

    if (requestedUserName) {
      params.set('userName', requestedUserName);
    }

    return `/attendance/details?${params.toString()}`;
  }, [listFromDate, listToDate, requestedUserId, requestedUserName]);

  return (
    <div className="space-y-6">
      <AttendanceSubpageHeader
        title={weekId || 'Week Detail'}
        description="Detailed weekly attendance breakdown using the existing attendance records and frontend-calculated hours."
        backHref={backHref}
        backLabel="Back to weekly list"
      />

      {isLoading ? (
        <AttendanceLoadingRow message="Loading weekly attendance detail..." />
      ) : (
        <AttendanceWeekDetailCard
          weekId={weekId}
          fromDate={fromDate}
          toDate={toDate}
          rows={rows}
          requestedUserName={requestedUserName}
        />
      )}
    </div>
  );
}
