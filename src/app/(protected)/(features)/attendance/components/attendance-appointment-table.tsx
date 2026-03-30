import { AttendanceAppointmentDTO } from '@/core/api/attendance';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDateTime } from './attendance-formatters';

type AttendanceAppointmentTableProps = {
  rows: AttendanceAppointmentDTO[];
  showUser?: boolean;
};

function getStatusVariant(status?: string | null): 'default' | 'secondary' {
  return status === 'CHECKED_OUT' ? 'default' : 'secondary';
}

export function AttendanceAppointmentTable({
  rows,
  showUser = false,
}: AttendanceAppointmentTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No appointment attendance records found.</p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            {showUser ? <TableHead>User</TableHead> : null}
            <TableHead>Lead No</TableHead>
            <TableHead>Order No</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Check In</TableHead>
            <TableHead>Check Out</TableHead>
            <TableHead className="min-w-64">Remark</TableHead>
            <TableHead className="min-w-40">Photo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((appointment) => (
            <TableRow key={appointment.id}>
              <TableCell>{appointment.appointmentDate || 'N/A'}</TableCell>
              {showUser ? (
                <TableCell>{appointment.userDisplayName || appointment.userLogin}</TableCell>
              ) : null}
              <TableCell>{appointment.leadNo}</TableCell>
              <TableCell>#{appointment.orderId}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(appointment.status)}>{appointment.status}</Badge>
              </TableCell>
              <TableCell>{formatDateTime(appointment.checkInTime)}</TableCell>
              <TableCell>{formatDateTime(appointment.checkOutTime)}</TableCell>
              <TableCell className="max-w-md whitespace-normal text-sm text-muted-foreground">
                {appointment.checkOutRemark?.trim() || 'No remark was saved for this appointment.'}
              </TableCell>
              <TableCell>
                {appointment.checkOutPhotoAvailable && appointment.checkOutPhotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={appointment.checkOutPhotoUrl}
                    alt={`Appointment ${appointment.id} checkout`}
                    className="h-28 w-40 rounded-md border object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-40 items-center justify-center rounded-md border border-dashed text-center text-xs text-muted-foreground">
                    No photo
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
