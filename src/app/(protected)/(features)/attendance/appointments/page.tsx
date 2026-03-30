'use client';

import { useGetMyAttendanceAppointments } from '@/core/api/attendance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AttendanceAppointmentTable,
  AttendanceLoadingRow,
  AttendanceSubpageHeader,
} from '../components';

export default function AttendanceAppointmentsPage() {
  const { data: appointments = [], isLoading } = useGetMyAttendanceAppointments();
  const checkedOutCount = appointments.filter(
    (appointment) => appointment.status === 'CHECKED_OUT'
  ).length;
  const activeCount = appointments.filter(
    (appointment) => appointment.status !== 'CHECKED_OUT'
  ).length;

  return (
    <div className="space-y-6">
      <AttendanceSubpageHeader
        title="My Appointment History"
        description="Review appointment check-in and check-out records, including the checkout remark and captured photo."
        backHref="/attendance"
        backLabel="Back to Attendance"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Appointments</CardDescription>
            <CardTitle className="text-2xl">{appointments.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Checked Out</CardDescription>
            <CardTitle className="text-2xl">{checkedOutCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-2xl">{activeCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {isLoading ? (
        <AttendanceLoadingRow message="Loading appointment history..." />
      ) : appointments.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No appointment attendance records found yet.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Appointment History Table</CardTitle>
            <CardDescription>
              Each row shows the appointment check-in, check-out, remark, and checkout photo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AttendanceAppointmentTable rows={appointments} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
