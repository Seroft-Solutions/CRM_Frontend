'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRBAC } from '@/core/auth';
import {
  AttendanceLocationDTO,
  attendanceQueryKeys,
  useCheckInAttendance,
  useCheckOutAttendance,
  useGetAdminAttendanceRecords,
  useGetMyAttendanceHistory,
  useGetMyTodayAttendance,
  useMarkLeaveAttendance,
} from '@/core/api/attendance';
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
  getOrganizationSettings,
  type OrganizationSettings,
} from '@/features/user-profile-management/services/organization-settings.service';
import {
  AttendanceAdminCard,
  AttendanceHeader,
  AttendanceTodayStatusCard,
  AttendanceWeekListCard,
  getDefaultWeeklyFromDateValue,
  getLocalDateInputValue,
} from './components';
import { formatCoordinates } from './components';

const GEO_SOURCE = 'BROWSER_GEOLOCATION';

type PendingWorkFromHomeCheckIn = {
  location: AttendanceLocationDTO;
  locationLabel: string | null;
};

function getLocationErrorMessage(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED)
    return 'Location permission denied. Please allow location access.';

  if (error.code === error.POSITION_UNAVAILABLE) return 'Location data is unavailable.';

  if (error.code === error.TIMEOUT) return 'Location request timed out.';

  return 'Could not retrieve location from browser.';
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

async function getCurrentLocation(): Promise<AttendanceLocationDTO> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('Geolocation is not supported by this browser.');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: GEO_SOURCE,
        });
      },
      (error) => reject(new Error(getLocationErrorMessage(error))),
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  });
}

async function resolveClientLocationName(location: AttendanceLocationDTO): Promise<string | null> {
  const params = new URLSearchParams({
    lat: String(location.latitude),
    lon: String(location.longitude),
  });

  const response = await fetch(`/api/location/reverse?${params.toString()}`, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as { locationName?: string; displayName?: string };

  return payload.locationName || payload.displayName || null;
}

function hasOfficeGeofence(
  settings: OrganizationSettings | undefined
): settings is OrganizationSettings {
  return !!(
    settings &&
    typeof settings.officeLatitude === 'number' &&
    typeof settings.officeLongitude === 'number' &&
    typeof settings.officeRadiusMeters === 'number' &&
    Number.isFinite(settings.officeLatitude) &&
    Number.isFinite(settings.officeLongitude) &&
    Number.isFinite(settings.officeRadiusMeters) &&
    settings.officeRadiusMeters > 0
  );
}

function calculateDistanceMeters(
  latitude1: number,
  longitude1: number,
  latitude2: number,
  longitude2: number
): number {
  const earthRadiusMeters = 6371000;
  const latitudeDistance = ((latitude2 - latitude1) * Math.PI) / 180;
  const longitudeDistance = ((longitude2 - longitude1) * Math.PI) / 180;
  const originLatitude = (latitude1 * Math.PI) / 180;
  const destinationLatitude = (latitude2 * Math.PI) / 180;

  const a =
    Math.sin(latitudeDistance / 2) * Math.sin(latitudeDistance / 2) +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDistance / 2) *
      Math.sin(longitudeDistance / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
}

function isWithinOfficeArea(
  location: AttendanceLocationDTO,
  settings: OrganizationSettings
): boolean {
  if (!hasOfficeGeofence(settings)) {
    return true;
  }

  return (
    calculateDistanceMeters(
      location.latitude,
      location.longitude,
      settings.officeLatitude!,
      settings.officeLongitude!
    ) <= settings.officeRadiusMeters!
  );
}

export default function AttendancePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAdmin, hasGroup } = useRBAC();
  const adminAccess = isAdmin() || hasGroup('Admins') || hasGroup('Super Admins');

  const [adminDate, setAdminDate] = useState<string>(getLocalDateInputValue());
  const [historyFromDate, setHistoryFromDate] = useState<string>(
    getDefaultWeeklyFromDateValue()
  );
  const [historyToDate, setHistoryToDate] = useState<string>(getLocalDateInputValue());
  const [pendingWorkFromHomeCheckIn, setPendingWorkFromHomeCheckIn] =
    useState<PendingWorkFromHomeCheckIn | null>(null);

  const adminParams = useMemo(
    () => ({
      fromDate: adminDate,
      toDate: adminDate,
      size: 500,
      sort: ['attendanceDate,desc', 'checkInTime,desc'],
    }),
    [adminDate]
  );

  const { data: todayStatus, isLoading: isTodayLoading } = useGetMyTodayAttendance({
    query: { enabled: !adminAccess },
  });

  const selfHistoryParams = useMemo(
    () => ({
      fromDate: historyFromDate,
      toDate: historyToDate,
      size: 366,
      sort: ['attendanceDate,desc', 'checkInTime,desc'],
    }),
    [historyFromDate, historyToDate]
  );

  const { data: selfHistoryRows = [], isLoading: isHistoryLoading } = useGetMyAttendanceHistory(
    selfHistoryParams,
    {
      query: { enabled: !adminAccess },
    }
  );

  const { data: adminRecords = [], isLoading: isAdminLoading } = useGetAdminAttendanceRecords(
    adminParams,
    {
      query: { enabled: adminAccess },
    }
  );

  const { data: organizationSettings } = useQuery({
    queryKey: ['attendance-organization-settings'],
    queryFn: getOrganizationSettings,
    enabled: !adminAccess,
    staleTime: 5 * 60 * 1000,
  });

  const invalidateAttendanceQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.today }),
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/my/history'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/admin/records'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/admin/user-records'] }),
    ]);
  };

  const checkInMutation = useCheckInAttendance({
    onSuccess: async (record) => {
      toast.success(
        record.status === 'CHECKED_IN_WORK_FROM_HOME'
          ? 'Checked in as work from home'
          : 'Checked in successfully'
      );
      setPendingWorkFromHomeCheckIn(null);
      await invalidateAttendanceQueries();
    },
    onError: (error) => {
      toast.error(error?.message || 'Check-in failed');
    },
  });

  const checkOutMutation = useCheckOutAttendance({
    onSuccess: async () => {
      toast.success('Checked out successfully');
      await invalidateAttendanceQueries();
    },
    onError: (error) => {
      toast.error(error?.message || 'Check-out failed');
    },
  });

  const leaveMutation = useMarkLeaveAttendance({
    onSuccess: async () => {
      toast.success('Leave marked successfully');
      await invalidateAttendanceQueries();
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to mark leave');
    },
  });

  const handleCheckIn = async () => {
    try {
      const location = await getCurrentLocation();

      if (
        hasOfficeGeofence(organizationSettings) &&
        !isWithinOfficeArea(location, organizationSettings)
      ) {
        const locationLabel = await resolveClientLocationName(location).catch(() => null);

        setPendingWorkFromHomeCheckIn({ location, locationLabel });

        return;
      }

      checkInMutation.mutate({ ...location, workFromHome: false });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to read location'));
    }
  };

  const handleWorkFromHomeConfirmation = () => {
    if (!pendingWorkFromHomeCheckIn) {
      return;
    }

    checkInMutation.mutate({
      ...pendingWorkFromHomeCheckIn.location,
      workFromHome: true,
    });
  };

  const handleCheckOut = async () => {
    try {
      const location = await getCurrentLocation();

      checkOutMutation.mutate(location);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to read location'));
    }
  };

  const handleMarkLeave = () => {
    leaveMutation.mutate();
  };

  const isBusy = checkInMutation.isPending || checkOutMutation.isPending || leaveMutation.isPending;
  const checkedIn = todayStatus?.checkedIn ?? false;
  const checkedOut = todayStatus?.checkedOut ?? false;
  const leaveMarked = todayStatus?.attendance?.status === 'LEAVE';

  const handleAdminViewDetails = (userId: string, userDisplayName?: string | null) => {
    const params = new URLSearchParams({
      userId,
      fromDate: adminDate,
      toDate: adminDate,
    });

    if (userDisplayName) {
      params.set('userName', userDisplayName);
    }

    router.push(`/attendance/details?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <AttendanceHeader />

      {!adminAccess && (
        <>
          <AttendanceTodayStatusCard
            todayStatus={todayStatus}
            isTodayLoading={isTodayLoading}
            isBusy={isBusy}
            checkedIn={checkedIn}
            checkedOut={checkedOut}
            leaveMarked={leaveMarked}
            isCheckInPending={checkInMutation.isPending}
            isCheckOutPending={checkOutMutation.isPending}
            isLeavePending={leaveMutation.isPending}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onLeave={handleMarkLeave}
          />
          <AttendanceWeekListCard
            title="Weekly Attendance"
            description="Review attendance grouped by week and open a detailed weekly breakdown."
            rows={selfHistoryRows}
            isLoading={isHistoryLoading}
            fromDate={historyFromDate}
            toDate={historyToDate}
            onFromDateChange={setHistoryFromDate}
            onToDateChange={setHistoryToDate}
            getWeekHref={(weekId, fromDate, toDate) => {
              const params = new URLSearchParams({
                weekId,
                fromDate,
                toDate,
                listFromDate: historyFromDate,
                listToDate: historyToDate,
              });

              return `/attendance/week-detail?${params.toString()}`;
            }}
          />
        </>
      )}

      {adminAccess && (
        <AttendanceAdminCard
          adminDate={adminDate}
          onAdminDateChange={setAdminDate}
          rows={adminRecords}
          isLoading={isAdminLoading}
          onViewDetails={(record) => handleAdminViewDetails(record.userId, record.userDisplayName)}
        />
      )}

      <AlertDialog
        open={!!pendingWorkFromHomeCheckIn}
        onOpenChange={(open) => {
          if (!open) {
            setPendingWorkFromHomeCheckIn(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Location mismatch</AlertDialogTitle>
            <AlertDialogDescription>
              your location is not with in the office area, Do you still want to check in as work
              from home
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pendingWorkFromHomeCheckIn ? (
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Client location:</span>{' '}
                {pendingWorkFromHomeCheckIn.locationLabel ||
                  formatCoordinates(
                    pendingWorkFromHomeCheckIn.location.latitude,
                    pendingWorkFromHomeCheckIn.location.longitude
                  )}
              </p>
              <p className="text-muted-foreground">
                {formatCoordinates(
                  pendingWorkFromHomeCheckIn.location.latitude,
                  pendingWorkFromHomeCheckIn.location.longitude
                )}
              </p>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={checkInMutation.isPending}>No</AlertDialogCancel>
            <AlertDialogAction
              disabled={checkInMutation.isPending}
              onClick={handleWorkFromHomeConfirmation}
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
