import { useMemo, useState } from 'react';
import { format, parseISO, startOfISOWeek } from 'date-fns';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { AttendanceRecordDTO } from '@/core/api/attendance';
import { invalidateAttendanceData, useSubmitApprovalRequest } from '@/core/api/attendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  buildWeekDays,
  canSubmitAttendanceWeek,
  formatWeekPeriod,
  getHoursForDay,
  getHoursForMode,
  getPrimaryWeekRecord,
  getRelatedAttendanceDates,
  getWorkingMinutes,
  deriveWeekStatus,
  hasWeekPassed,
  isWeekComplete,
} from './attendance-week-utils';
import { AttendanceApprovalStatusBadge } from './attendance-approval-status-badge';
import { formatDurationFromMinutes } from './attendance-formatters';
import { AttendanceWeekStatusBadge } from './attendance-week-status-badge';

type AttendanceWeekDetailCardProps = {
  weekId: string;
  fromDate: string;
  toDate: string;
  rows: AttendanceRecordDTO[];
  requestedUserName?: string;
};

export function AttendanceWeekDetailCard({
  weekId,
  fromDate,
  toDate,
  rows,
  requestedUserName,
}: AttendanceWeekDetailCardProps) {
  const queryClient = useQueryClient();
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const weekDays = buildWeekDays(fromDate);
  const recordsByDate = new Map(rows.map((record) => [record.attendanceDate, record]));
  const primaryRecord = getPrimaryWeekRecord(rows);
  const totalMinutes = rows.reduce((sum, record) => sum + getWorkingMinutes(record), 0);
  const relatedDates = getRelatedAttendanceDates(rows);
  const weekStatus = deriveWeekStatus(rows);
  const modeRows: Array<'OFFICE' | 'WORK_FROM_HOME' | 'LEAVE'> = [
    'OFFICE',
    'WORK_FROM_HOME',
    'LEAVE',
  ];

  const weekStartDate = useMemo(() => {
    if (!fromDate) return '';

    return format(startOfISOWeek(parseISO(fromDate)), 'yyyy-MM-dd');
  }, [fromDate]);

  const weekComplete = isWeekComplete(fromDate, rows);
  const weekPassed = hasWeekPassed(fromDate);
  const canSubmitRequest = canSubmitAttendanceWeek(fromDate, rows);

  const submitMutation = useSubmitApprovalRequest({
    onSuccess: async () => {
      toast.success('Attendance approval request submitted successfully');
      setIsSubmitDialogOpen(false);
      await invalidateAttendanceData(queryClient);
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to submit approval request');
    },
  });

  const handleSubmitRequest = () => {
    if (!weekStartDate) return;
    submitMutation.mutate(weekStartDate);
  };

  function isDayInactive(dayKey: string): boolean {
    const record = recordsByDate.get(dayKey);

    if (!record) return true;
    if (record.status === 'LEAVE') return true;
    if (!record.checkInTime) return true;

    return false;
  }

  function getDayStatusTextClass(dayKey: string): string {
    const record = recordsByDate.get(dayKey);

    if (isDayInactive(dayKey)) {
      return 'text-red-600';
    }

    if (record?.approvalStatus === 'APPROVED') {
      return 'text-emerald-600';
    }

    if (record?.approvalStatus === 'PENDING' || record?.approvalStatus === 'SUBMITTED') {
      return 'text-amber-600';
    }

    return 'text-muted-foreground';
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Time Worked</CardTitle>
            <CardDescription>
              Week view for {weekId} based on existing attendance records.
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <AttendanceWeekStatusBadge status={weekStatus} />
            <Button
              type="button"
              size="sm"
              className="bg-amber-600 text-white hover:bg-amber-700"
              onClick={() => setIsSubmitDialogOpen(true)}
              disabled={!canSubmitRequest || submitMutation.isPending}
            >
              Submit Request
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!canSubmitRequest ? (
            <div className="mb-4 rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
              Submit is available only after the selected Monday-Sunday week has passed and all 7
              daily records exist. Current check: {weekPassed ? 'week passed' : 'active week'},{' '}
              {weekComplete ? '7 days present' : 'missing daily records'}.
            </div>
          ) : null}
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-muted/40">
                <tr className="border-b">
                  <th className="sticky left-0 z-10 min-w-40 border-r bg-muted/40 px-4 py-3 text-left font-medium">
                    Day
                  </th>
                  {weekDays.map((day) => {
                    const dayStatusTextClass = getDayStatusTextClass(day.key);

                    return (
                      <th key={day.key} className="min-w-24 px-4 py-3 text-center font-medium">
                        <div className={dayStatusTextClass}>{day.displayDate}</div>
                        <div className={cn('text-xs font-normal', dayStatusTextClass)}>
                          {day.label}
                        </div>
                      </th>
                    );
                  })}
                  <th className="min-w-28 px-4 py-3 text-center font-medium">Total Worked</th>
                </tr>
              </thead>
              <tbody>
                {modeRows.map((mode) => {
                  const modeTotal = weekDays.reduce((sum, day) => {
                    const record = recordsByDate.get(day.key);

                    if (!record || record.checkInMode !== mode) return sum;

                    return sum + getWorkingMinutes(record);
                  }, 0);

                  return (
                    <tr key={mode} className="border-b">
                      <td className="sticky left-0 border-r bg-background px-4 py-3 font-medium">
                        {mode}
                      </td>
                      {weekDays.map((day) => (
                        <td key={`${mode}-${day.key}`} className="px-4 py-3 text-center">
                          {getHoursForMode(recordsByDate.get(day.key), mode)}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center font-medium">
                        {formatDurationFromMinutes(modeTotal)}
                      </td>
                    </tr>
                  );
                })}
                <tr className="border-b bg-muted/20">
                  <td className="sticky left-0 border-r bg-muted/20 px-4 py-3 font-medium">
                    ST /Hr
                  </td>
                  {weekDays.map((day) => (
                    <td key={`st-${day.key}`} className="px-4 py-3 text-center">
                      {getHoursForDay(recordsByDate.get(day.key))}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center font-medium">
                    {formatDurationFromMinutes(totalMinutes)}
                  </td>
                </tr>
                <tr className="bg-muted/30">
                  <td className="sticky left-0 border-r bg-muted/30 px-4 py-3 font-medium">
                    Total Worked
                  </td>
                  {weekDays.map((day) => (
                    <td key={`total-${day.key}`} className="px-4 py-3 text-center font-medium">
                      {getHoursForDay(recordsByDate.get(day.key))}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center font-bold">
                    {formatDurationFromMinutes(totalMinutes)}
                  </td>
                </tr>
                <tr>
                  <td className="sticky left-0 border-r bg-background px-4 py-3 font-medium">
                    Approval Status
                  </td>
                  {weekDays.map((day) => (
                    <td key={`approval-${day.key}`} className="px-4 py-3 text-center">
                      <AttendanceApprovalStatusBadge
                        status={recordsByDate.get(day.key)?.approvalStatus}
                      />
                    </td>
                  ))}
                  <td className="px-4 py-3 text-center">
                    <AttendanceWeekStatusBadge status={weekStatus} />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Posting Information</CardTitle>
          <CardDescription>Derived from the existing attendance record fields.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <PostingField label="Week Period" value={formatWeekPeriod(fromDate, toDate)} />
            <PostingField label="Week ID" value={weekId} />
            <PostingField
              label="User"
              value={
                primaryRecord
                  ? `${primaryRecord.userDisplayName || requestedUserName || primaryRecord.userLogin || 'N/A'} (${primaryRecord.userLogin || 'N/A'})`
                  : requestedUserName || 'N/A'
              }
            />
            <PostingField label="Email" value={primaryRecord?.userEmail || 'N/A'} />
            <PostingField label="Total ST Hours" value={formatDurationFromMinutes(totalMinutes)} />
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-medium">Related Records</h3>
            <div className="flex flex-wrap gap-2">
              {relatedDates.length > 0 ? (
                relatedDates.map((attendanceDate) => (
                  <span
                    key={attendanceDate}
                    className="rounded-full border px-3 py-1 text-xs font-medium"
                  >
                    {attendanceDate}
                  </span>
                ))
              ) : (
                <span className="text-sm text-muted-foreground">
                  No individual attendance records for this week.
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Attendance Request</AlertDialogTitle>
            <AlertDialogDescription>
              Submit this completed Monday-Sunday week for manager approval. The week status will be
              marked as submitted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={submitMutation.isPending}
              onClick={handleSubmitRequest}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

type PostingFieldProps = {
  label: string;
  value: string;
};

function PostingField({ label, value }: PostingFieldProps) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}
