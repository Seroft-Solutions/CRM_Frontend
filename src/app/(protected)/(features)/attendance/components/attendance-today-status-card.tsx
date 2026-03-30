import Link from 'next/link';
import { Ban, Clock3, Loader2, LogIn, LogOut, MapPin, NotebookTabs } from 'lucide-react';
import { AttendanceAppointmentDTO, AttendanceTodayStatusDTO } from '@/core/api/attendance';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { AttendanceLoadingRow } from './attendance-loading-row';
import { AttendanceLocationName } from './attendance-location-name';
import { formatDateTime } from './attendance-formatters';
import { AttendanceStatusBadge } from './attendance-status-badge';

type AttendanceTodayStatusCardProps = {
  todayStatus?: AttendanceTodayStatusDTO;
  isTodayLoading: boolean;
  isBusy: boolean;
  checkedIn: boolean;
  checkedOut: boolean;
  leaveMarked: boolean;
  isCheckInPending: boolean;
  isCheckOutPending: boolean;
  isLeavePending: boolean;
  activeAppointment?: AttendanceAppointmentDTO | null;
  isAppointmentCheckInPending: boolean;
  isAppointmentCheckOutPending: boolean;
  appointmentHistoryHref: string;
  onCheckIn: () => void;
  onCheckOut: () => void;
  onLeave: () => void;
  onAppointmentCheckIn: () => void;
  onAppointmentCheckOut: () => void;
};

export function AttendanceTodayStatusCard({
  todayStatus,
  isTodayLoading,
  isBusy,
  checkedIn,
  checkedOut,
  leaveMarked,
  isCheckInPending,
  isCheckOutPending,
  isLeavePending,
  activeAppointment,
  isAppointmentCheckInPending,
  isAppointmentCheckOutPending,
  appointmentHistoryHref,
  onCheckIn,
  onCheckOut,
  onLeave,
  onAppointmentCheckIn,
  onAppointmentCheckOut,
}: AttendanceTodayStatusCardProps) {
  const hasActiveAppointment = !!activeAppointment && !activeAppointment.checkOutTime;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock3 className="h-5 w-5" />
          Today&apos;s Status
        </CardTitle>
        <CardDescription>Your live attendance state for today.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isTodayLoading ? (
          <AttendanceLoadingRow message="Loading attendance status..." />
        ) : (
          <>
            <div className="flex items-center gap-2">
              <AttendanceStatusBadge status={todayStatus?.attendance?.status} />
              <span className="text-sm text-muted-foreground">
                Check in: {formatDateTime(todayStatus?.attendance?.checkInTime)} | Check out:{' '}
                {formatDateTime(todayStatus?.attendance?.checkOutTime)}
              </span>
            </div>

            <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Check in location:{' '}
                <AttendanceLocationName
                  latitude={todayStatus?.attendance?.checkInLatitude}
                  longitude={todayStatus?.attendance?.checkInLongitude}
                />
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Check out location:{' '}
                <AttendanceLocationName
                  latitude={todayStatus?.attendance?.checkOutLatitude}
                  longitude={todayStatus?.attendance?.checkOutLongitude}
                />
              </div>
            </div>
          </>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={onCheckIn}
            disabled={isBusy || checkedIn || leaveMarked}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {isCheckInPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            Check In
          </Button>
          <Button
            onClick={onCheckOut}
            disabled={isBusy || !checkedIn || checkedOut || leaveMarked}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isCheckOutPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Check Out
          </Button>
          <Button
            onClick={onLeave}
            disabled={isBusy || checkedIn || checkedOut || leaveMarked}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isLeavePending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Ban className="mr-2 h-4 w-4" />
            )}
            {leaveMarked ? 'Leave Marked' : 'Leave / Absent'}
          </Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-sm font-semibold">Appointment Attendance</h3>
              <p className="text-muted-foreground text-sm">
                Track customer or order visits separately from daily attendance.
              </p>
            </div>
            <Badge variant={hasActiveAppointment ? 'default' : 'secondary'}>
              {hasActiveAppointment ? 'Active Appointment' : 'No Active Appointment'}
            </Badge>
          </div>

          {activeAppointment ? (
            <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
              <div>
                <span className="font-medium text-foreground">Lead No:</span>{' '}
                {activeAppointment.leadNo}
              </div>
              <div>
                <span className="font-medium text-foreground">Order No:</span> #
                {activeAppointment.orderId}
              </div>
              <div>
                <span className="font-medium text-foreground">Check in:</span>{' '}
                {formatDateTime(activeAppointment.checkInTime)}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={onAppointmentCheckIn}
              disabled={isBusy || leaveMarked || hasActiveAppointment}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {isAppointmentCheckInPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Check In Appointment
            </Button>
            <Button
              onClick={onAppointmentCheckOut}
              disabled={isBusy || !hasActiveAppointment}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              {isAppointmentCheckOutPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="mr-2 h-4 w-4" />
              )}
              Check Out Appointment
            </Button>
            <Button asChild variant="outline">
              <Link href={appointmentHistoryHref}>
                <NotebookTabs className="mr-2 h-4 w-4" />
                View Appointment History
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
