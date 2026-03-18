'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useRBAC } from '@/core/auth';
import {
  useGetAdminUserAttendanceRecords,
  useGetMyAttendanceHistory,
} from '@/core/api/attendance';
import { Button } from '@/components/ui/button';
import {
  AttendanceHeader,
  AttendanceLoadingRow,
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline">
            <Link href={backHref}>
              <ArrowLeft className="h-4 w-4" />
              Back to weekly list
            </Link>
          </Button>
          <AttendanceHeader />
        </div>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-semibold">
          {weekId || 'Week Detail'}
        </h2>
        <p className="text-sm text-muted-foreground">
          Detailed weekly attendance breakdown using the existing attendance records and
          frontend-calculated hours.
        </p>
      </div>

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
