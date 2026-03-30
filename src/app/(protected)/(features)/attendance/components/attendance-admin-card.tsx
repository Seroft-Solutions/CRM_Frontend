'use client';

import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AttendanceAppointmentDTO, AttendanceRecordDTO } from '@/core/api/attendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AttendanceAppointmentTable } from './attendance-appointment-table';
import { AttendanceLoadingRow } from './attendance-loading-row';
import { AttendanceTable } from './attendance-table';

type AttendanceAdminCardProps = {
  adminDate: string;
  onAdminDateChange: (value: string) => void;
  attendanceRows: AttendanceRecordDTO[];
  appointmentRows: AttendanceAppointmentDTO[];
  isAttendanceLoading: boolean;
  isAppointmentLoading: boolean;
  onViewDetails: (record: AttendanceRecordDTO) => void;
};

export function AttendanceAdminCard({
  adminDate,
  onAdminDateChange,
  attendanceRows,
  appointmentRows,
  isAttendanceLoading,
  isAppointmentLoading,
  onViewDetails,
}: AttendanceAdminCardProps) {
  const appointmentUsers = useMemo(() => {
    const groupedUsers = new Map<
      string,
      {
        userId: string;
        label: string;
        count: number;
      }
    >();

    for (const appointment of appointmentRows) {
      const userId = appointment.userId;

      if (!userId) {
        continue;
      }

      const existingUser = groupedUsers.get(userId);

      if (existingUser) {
        existingUser.count += 1;
        continue;
      }

      groupedUsers.set(userId, {
        userId,
        label: appointment.userDisplayName || appointment.userLogin || userId,
        count: 1,
      });
    }

    return Array.from(groupedUsers.values()).sort((left, right) =>
      left.label.localeCompare(right.label)
    );
  }, [appointmentRows]);

  const [selectedAppointmentUserId, setSelectedAppointmentUserId] = useState<string>('');

  useEffect(() => {
    if (!appointmentUsers.length) {
      setSelectedAppointmentUserId('');

      return;
    }

    const selectedUserStillExists = appointmentUsers.some(
      (appointmentUser) => appointmentUser.userId === selectedAppointmentUserId
    );

    if (!selectedUserStillExists) {
      setSelectedAppointmentUserId(appointmentUsers[0]?.userId ?? '');
    }
  }, [appointmentUsers, selectedAppointmentUserId]);

  const selectedAppointmentUser = appointmentUsers.find(
    (appointmentUser) => appointmentUser.userId === selectedAppointmentUserId
  );
  const selectedUserAppointments = appointmentRows.filter(
    (appointment) => appointment.userId === selectedAppointmentUserId
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          Admin Attendance View
        </CardTitle>
        <CardDescription>All user attendance for the selected date.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="max-w-xs">
          <Input
            type="date"
            value={adminDate}
            onChange={(event) => onAdminDateChange(event.target.value)}
          />
        </div>
        <Tabs defaultValue="attendance" className="gap-4">
          <TabsList className="w-full justify-start sm:w-fit">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance">
            {isAttendanceLoading ? (
              <AttendanceLoadingRow message="Loading admin attendance..." />
            ) : (
              <AttendanceTable rows={attendanceRows} showActions onViewDetails={onViewDetails} />
            )}
          </TabsContent>

          <TabsContent value="appointments">
            {isAppointmentLoading ? (
              <AttendanceLoadingRow message="Loading admin appointment attendance..." />
            ) : appointmentUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No appointment attendance records found for the selected date.
              </p>
            ) : (
              <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                <Card className="gap-4 py-4">
                  <CardHeader className="px-4">
                    <CardTitle className="text-base">Users With Appointments</CardTitle>
                    <CardDescription>
                      Select a user to view all appointment check-ins and check-outs for{' '}
                      {adminDate || 'the selected date'}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-2 px-4">
                    {appointmentUsers.map((appointmentUser) => (
                      <Button
                        key={appointmentUser.userId}
                        type="button"
                        variant={
                          appointmentUser.userId === selectedAppointmentUserId
                            ? 'default'
                            : 'outline'
                        }
                        className="justify-between"
                        onClick={() => setSelectedAppointmentUserId(appointmentUser.userId)}
                      >
                        <span className="truncate">{appointmentUser.label}</span>
                        <span>{appointmentUser.count}</span>
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                <Card className="gap-4 py-4">
                  <CardHeader className="px-4">
                    <CardTitle className="text-base">
                      {selectedAppointmentUser?.label || 'Selected User'} Appointment List
                    </CardTitle>
                    <CardDescription>
                      {selectedUserAppointments.length} appointment
                      {selectedUserAppointments.length === 1 ? '' : 's'} on{' '}
                      {adminDate || 'the selected date'}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4">
                    <AttendanceAppointmentTable rows={selectedUserAppointments} />
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
