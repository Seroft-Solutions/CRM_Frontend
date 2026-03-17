import { AttendanceRecordDTO } from '@/core/api/attendance';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AttendanceLocationName } from './attendance-location-name';
import { formatDateTime, formatDurationFromMinutes } from './attendance-formatters';
import { AttendanceStatusBadge } from './attendance-status-badge';

type AttendanceTableProps = {
  rows: AttendanceRecordDTO[];
  showActions?: boolean;
  onViewDetails?: (record: AttendanceRecordDTO) => void;
};

export function AttendanceTable({
  rows,
  showActions = false,
  onViewDetails,
}: AttendanceTableProps) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground">No attendance records found.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Check In</TableHead>
            <TableHead>Check Out</TableHead>
            <TableHead>Working Hours</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Check In Location</TableHead>
            <TableHead>Check Out Location</TableHead>
            {showActions ? <TableHead>Actions</TableHead> : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{record.attendanceDate}</TableCell>
              <TableCell>{record.userDisplayName || record.userLogin}</TableCell>
              <TableCell>{formatDateTime(record.checkInTime)}</TableCell>
              <TableCell>{formatDateTime(record.checkOutTime)}</TableCell>
              <TableCell>{formatWorkingHours(record.checkInTime, record.checkOutTime)}</TableCell>
              <TableCell>
                <AttendanceStatusBadge status={record.status} />
              </TableCell>
              <TableCell>
                <AttendanceLocationName
                  latitude={record.checkInLatitude}
                  longitude={record.checkInLongitude}
                />
              </TableCell>
              <TableCell>
                <AttendanceLocationName
                  latitude={record.checkOutLatitude}
                  longitude={record.checkOutLongitude}
                />
              </TableCell>
              {showActions ? (
                <TableCell>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails?.(record)}
                  >
                    View Attendance Details
                  </Button>
                </TableCell>
              ) : null}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function formatWorkingHours(checkInTime?: string | null, checkOutTime?: string | null): string {
  if (!checkInTime || !checkOutTime) {
    return '0h 0m';
  }

  const startedAt = new Date(checkInTime).getTime();
  const endedAt = new Date(checkOutTime).getTime();

  if (Number.isNaN(startedAt) || Number.isNaN(endedAt) || endedAt <= startedAt) {
    return '0h 0m';
  }

  return formatDurationFromMinutes((endedAt - startedAt) / 60000);
}
