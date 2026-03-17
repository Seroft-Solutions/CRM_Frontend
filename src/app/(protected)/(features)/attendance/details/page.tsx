'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useRBAC } from '@/core/auth';
import { useGetAdminUserAttendanceRecords, useGetMyAttendanceHistory } from '@/core/api/attendance';
import { Button } from '@/components/ui/button';
import { AttendanceHeader, AttendanceMyHistoryCard } from '../components';

function getLocalDateInputValue(date: Date = new Date()): string {
  const timezoneOffset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

export default function AttendanceDetailsPage() {
  const searchParams = useSearchParams();
  const { isAdmin, hasGroup } = useRBAC();
  const adminAccess = isAdmin() || hasGroup('Admins') || hasGroup('Super Admins');
  const requestedUserId = searchParams.get('userId') || '';
  const requestedUserName = searchParams.get('userName') || '';
  const [fromDate, setFromDate] = useState<string>(
    searchParams.get('fromDate') ||
      getLocalDateInputValue(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000))
  );
  const [toDate, setToDate] = useState<string>(
    searchParams.get('toDate') || getLocalDateInputValue()
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
  const totalWorkingMinutes = useMemo(
    () =>
      rows.reduce((totalMinutes, record) => {
        if (!record.checkInTime || !record.checkOutTime) {
          return totalMinutes;
        }

        const startedAt = new Date(record.checkInTime).getTime();
        const endedAt = new Date(record.checkOutTime).getTime();

        if (Number.isNaN(startedAt) || Number.isNaN(endedAt) || endedAt <= startedAt) {
          return totalMinutes;
        }

        return totalMinutes + (endedAt - startedAt) / 60000;
      }, 0),
    [rows]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <AttendanceHeader />
        <Button asChild variant="outline">
          <Link href="/attendance">
            <ArrowLeft className="h-4 w-4" />
            Back to Attendance
          </Link>
        </Button>
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-semibold">
          {requestedUserId
            ? `${requestedUserName || requestedUserId} Attendance Details`
            : 'My Attendance Details'}
        </h2>
        <p className="text-sm text-muted-foreground">
          View attendance details, working hours, check in, and check out information for the
          selected date range.
        </p>
      </div>

      <AttendanceMyHistoryCard
        rows={rows}
        isLoading={isLoading}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
        totalWorkingMinutes={totalWorkingMinutes}
      />
    </div>
  );
}
