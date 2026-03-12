import { AttendanceRecordDTO } from '@/core/api/attendance';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AttendanceLocationName } from './attendance-location-name';
import { formatDateTime } from './attendance-formatters';
import { AttendanceStatusBadge } from './attendance-status-badge';

type AttendanceTableProps = {
  rows: AttendanceRecordDTO[];
};

export function AttendanceTable({ rows }: AttendanceTableProps) {
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
            <TableHead>Status</TableHead>
            <TableHead>Check In Location</TableHead>
            <TableHead>Check Out Location</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{record.attendanceDate}</TableCell>
              <TableCell>{record.userDisplayName || record.userLogin}</TableCell>
              <TableCell>{formatDateTime(record.checkInTime)}</TableCell>
              <TableCell>{formatDateTime(record.checkOutTime)}</TableCell>
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
