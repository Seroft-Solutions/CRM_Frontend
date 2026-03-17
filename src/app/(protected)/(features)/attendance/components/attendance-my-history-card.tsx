import { AttendanceRecordDTO } from '@/core/api/attendance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AttendanceLoadingRow } from './attendance-loading-row';
import { formatDateTime, formatDurationFromMinutes } from './attendance-formatters';
import { AttendanceTable } from './attendance-table';

type AttendanceMyHistoryCardProps = {
  rows: AttendanceRecordDTO[];
  isLoading: boolean;
  fromDate: string;
  toDate: string;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  totalWorkingMinutes: number;
};

export function AttendanceMyHistoryCard({
  rows,
  isLoading,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  totalWorkingMinutes,
}: AttendanceMyHistoryCardProps) {
  const completedRows = rows.filter((row) => row.checkInTime && row.checkOutTime);
  const leaveRows = rows.filter((row) => row.status === 'LEAVE');
  const earliestCompletedRow =
    completedRows.length > 0 ? completedRows[completedRows.length - 1] : undefined;
  const latestCompletedRow = completedRows.length > 0 ? completedRows[0] : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attendance Details</CardTitle>
        <CardDescription>
          Detailed attendance based on the selected start date and end date.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Start Date</label>
            <Input
              type="date"
              value={fromDate}
              onChange={(event) => onFromDateChange(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">End Date</label>
            <Input
              type="date"
              value={toDate}
              onChange={(event) => onToDateChange(event.target.value)}
            />
          </div>
          <SummaryBox
            label="Total Working Hours"
            value={formatDurationFromMinutes(totalWorkingMinutes)}
          />
          <SummaryBox label="Leave / Absent Days" value={String(leaveRows.length)} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SummaryBox label="Total Records" value={String(rows.length)} />
          <SummaryBox
            label="First Check In"
            value={formatDateTime(earliestCompletedRow?.checkInTime)}
          />
          <SummaryBox
            label="Last Check Out"
            value={formatDateTime(latestCompletedRow?.checkOutTime)}
          />
        </div>

        {isLoading ? (
          <AttendanceLoadingRow message="Loading history..." />
        ) : (
          <AttendanceTable rows={rows} />
        )}
      </CardContent>
    </Card>
  );
}

type SummaryBoxProps = {
  label: string;
  value: string;
};

function SummaryBox({ label, value }: SummaryBoxProps) {
  return (
    <div className="rounded-lg border bg-muted/30 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}
