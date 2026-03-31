import type { AttendanceRecordDTO } from '@/core/api/attendance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  buildWeekDays,
  formatHoursDecimal,
  formatWeekPeriod,
  getHoursForDay,
  getHoursForMode,
  getPrimaryWeekRecord,
  getRelatedAttendanceDates,
  getWorkingMinutes,
} from './attendance-week-utils';

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
  const weekDays = buildWeekDays(fromDate);
  const recordsByDate = new Map(rows.map((record) => [record.attendanceDate, record]));
  const primaryRecord = getPrimaryWeekRecord(rows);
  const totalMinutes = rows.reduce((sum, record) => sum + getWorkingMinutes(record), 0);
  const relatedDates = getRelatedAttendanceDates(rows);
  const modeRows: Array<'OFFICE' | 'WORK_FROM_HOME' | 'LEAVE'> = [
    'OFFICE',
    'WORK_FROM_HOME',
    'LEAVE',
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Time Worked</CardTitle>
          <CardDescription>
            Week view for {weekId} based on existing attendance records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-muted/40">
                <tr className="border-b">
                  <th className="sticky left-0 z-10 min-w-40 border-r bg-muted/40 px-4 py-3 text-left font-medium">
                    Mode
                  </th>
                  {weekDays.map((day) => (
                    <th key={day.key} className="min-w-24 px-4 py-3 text-center font-medium">
                      <div>{day.displayDate}</div>
                      <div className="text-xs font-normal text-muted-foreground">{day.label}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modeRows.map((mode) => (
                  <tr key={mode} className="border-b">
                    <td className="sticky left-0 border-r bg-background px-4 py-3 font-medium">
                      {mode}
                    </td>
                    {weekDays.map((day) => (
                      <td key={`${mode}-${day.key}`} className="px-4 py-3 text-center">
                        {getHoursForMode(recordsByDate.get(day.key), mode)}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-b bg-muted/20">
                  <td className="sticky left-0 border-r bg-muted/20 px-4 py-3 font-medium">
                    ST /Hr
                  </td>
                  {weekDays.map((day) => (
                    <td key={`st-${day.key}`} className="px-4 py-3 text-center">
                      {getHoursForDay(recordsByDate.get(day.key))}
                    </td>
                  ))}
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
            <PostingField label="Total ST Hours" value={formatHoursDecimal(totalMinutes)} />
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
