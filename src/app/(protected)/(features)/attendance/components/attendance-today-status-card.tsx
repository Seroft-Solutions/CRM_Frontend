import { Clock3, Loader2, LogIn, LogOut, MapPin } from 'lucide-react';
import { AttendanceTodayStatusDTO } from '@/core/api/attendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  isCheckInPending: boolean;
  isCheckOutPending: boolean;
  onCheckIn: () => void;
  onCheckOut: () => void;
};

export function AttendanceTodayStatusCard({
  todayStatus,
  isTodayLoading,
  isBusy,
  checkedIn,
  checkedOut,
  isCheckInPending,
  isCheckOutPending,
  onCheckIn,
  onCheckOut,
}: AttendanceTodayStatusCardProps) {
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
            disabled={isBusy || checkedIn}
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
            disabled={isBusy || !checkedIn || checkedOut}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isCheckOutPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Check Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
