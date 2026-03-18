'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useRBAC } from '@/core/auth';
import { useGetAdminUserAttendanceRecords, useGetMyAttendanceHistory } from '@/core/api/attendance';
import { Button } from '@/components/ui/button';
import {
  AttendanceHeader,
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
          {requestedUserId ? `${requestedUserName || requestedUserId} Weekly Attendance` : 'My Weekly Attendance'}
        </h2>
        <p className="text-sm text-muted-foreground">
          Browse attendance grouped by week and open the detailed time-worked view for each week.
        </p>
      </div>

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
