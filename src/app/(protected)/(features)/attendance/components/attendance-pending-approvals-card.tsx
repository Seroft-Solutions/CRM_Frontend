'use client';

import { useMemo } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import type { AttendanceRecordDTO } from '@/core/api/attendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AttendanceApprovalStatusBadge } from './attendance-approval-status-badge';
import { AttendanceLoadingRow } from './attendance-loading-row';
import { AttendanceStatusBadge } from './attendance-status-badge';
import {
  buildWeekDays,
  formatWeekPeriodLong,
  getWeekBoundaryDates,
  getWeekIdFromAttendanceDate,
} from './attendance-week-utils';

type AttendancePendingApprovalsCardProps = {
  rows: AttendanceRecordDTO[];
  isLoading: boolean;
  embedded?: boolean;
  approvingDayId?: number | null;
  approvingWeekKey?: string | null;
  onApproveDay: (record: AttendanceRecordDTO) => void;
  onApproveWeek: (userId: string, weekStartDate: string, weekKey: string) => void;
};

type PendingApprovalWeek = {
  key: string;
  weekId: string;
  weekStartDate: string;
  weekEndDate: string;
  userId: string;
  employeeName: string;
  records: AttendanceRecordDTO[];
};

export function AttendancePendingApprovalsCard({
  rows,
  isLoading,
  embedded = false,
  approvingDayId,
  approvingWeekKey,
  onApproveDay,
  onApproveWeek,
}: AttendancePendingApprovalsCardProps) {
  const pendingWeeks = useMemo(() => buildPendingApprovalWeeks(rows), [rows]);

  const content = (
    <>
      {isLoading ? (
        <AttendanceLoadingRow message="Loading pending approval requests…" />
      ) : pendingWeeks.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No submitted attendance weeks are pending approval.
        </p>
      ) : (
        <div className="space-y-4">
          {pendingWeeks.map((week) => {
            const days = buildWeekDays(week.weekStartDate);
            const recordsByDate = new Map(
              week.records.map((record) => [record.attendanceDate, record])
            );
            const submittedDays = week.records.filter(
              (record) =>
                record.approvalStatus === 'SUBMITTED' || record.approvalStatus === 'PENDING'
            );

            return (
              <section key={week.key} className="rounded-md border">
                <div className="flex flex-col gap-3 border-b bg-muted/30 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold">{week.employeeName}</h3>
                    <p className="text-xs text-muted-foreground">
                      {week.weekId} · {formatWeekPeriodLong(week.weekStartDate, week.weekEndDate)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="gap-2 bg-blue-600 text-white hover:bg-blue-700"
                    disabled={submittedDays.length === 0 || approvingWeekKey === week.key}
                    onClick={() => onApproveWeek(week.userId, week.weekStartDate, week.key)}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    {approvingWeekKey === week.key ? 'Approving…' : 'Approve Full Week'}
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-32">Day</TableHead>
                        <TableHead className="min-w-36">Attendance Status</TableHead>
                        <TableHead className="min-w-36">Approval Status</TableHead>
                        <TableHead className="min-w-32 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {days.map((day) => {
                        const record = recordsByDate.get(day.key);
                        const canApprove =
                          record?.approvalStatus === 'SUBMITTED' ||
                          record?.approvalStatus === 'PENDING';

                        return (
                          <TableRow key={day.key}>
                            <TableCell>
                              <div className="font-medium">{day.label}</div>
                              <div className="text-xs text-muted-foreground">{day.key}</div>
                            </TableCell>
                            <TableCell>
                              <AttendanceStatusBadge status={record?.status} />
                            </TableCell>
                            <TableCell>
                              <AttendanceApprovalStatusBadge status={record?.approvalStatus} />
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={!record || !canApprove || approvingDayId === record.id}
                                onClick={() => record && onApproveDay(record)}
                              >
                                {approvingDayId === record?.id ? 'Approving…' : 'Approve Day'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );

  if (embedded) {
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-base font-semibold">Pending Approvals</h3>
          <p className="text-sm text-muted-foreground">
            Review submitted weekly attendance requests and approve individual days or the full
            week.
          </p>
        </div>
        {content}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Pending Approvals
        </CardTitle>
        <CardDescription>
          Review submitted weekly attendance requests and approve individual days or the full week.
        </CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}

function buildPendingApprovalWeeks(rows: AttendanceRecordDTO[]): PendingApprovalWeek[] {
  const groupedWeeks = new Map<string, PendingApprovalWeek>();

  rows.forEach((record) => {
    if (!record.userId || !record.attendanceDate) {
      return;
    }

    const { weekStartDate, weekEndDate } = getWeekBoundaryDates(record.attendanceDate);
    const key = `${record.userId}:${weekStartDate}`;
    const existingWeek = groupedWeeks.get(key);

    if (existingWeek) {
      existingWeek.records.push(record);

      return;
    }

    groupedWeeks.set(key, {
      key,
      weekId: getWeekIdFromAttendanceDate(record.attendanceDate),
      weekStartDate,
      weekEndDate,
      userId: record.userId,
      employeeName: record.userDisplayName || record.userLogin || record.userId,
      records: [record],
    });
  });

  return Array.from(groupedWeeks.values())
    .filter((week) =>
      week.records.some(
        (record) => record.approvalStatus === 'SUBMITTED' || record.approvalStatus === 'PENDING'
      )
    )
    .map((week) => ({
      ...week,
      records: [...week.records].sort((left, right) =>
        left.attendanceDate.localeCompare(right.attendanceDate)
      ),
    }))
    .sort(
      (left, right) =>
        right.weekStartDate.localeCompare(left.weekStartDate) ||
        left.employeeName.localeCompare(right.employeeName)
    );
}
