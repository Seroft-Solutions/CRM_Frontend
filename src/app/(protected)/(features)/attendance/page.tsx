'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
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
} from '@/core/api/attendance';
import {
  AttendanceAdminCard,
  AttendanceHeader,
  AttendanceMyHistoryCard,
  AttendanceTodayStatusCard,
} from './components';

const GEO_SOURCE = 'BROWSER_GEOLOCATION';

function getLocalDateInputValue(date: Date = new Date()): string {
  const timezoneOffset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 10);
}

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

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const { isAdmin, hasGroup } = useRBAC();
  const adminAccess = isAdmin() || hasGroup('Admins') || hasGroup('Super Admins');

  const [adminDate, setAdminDate] = useState<string>(getLocalDateInputValue());

  const myHistoryParams = useMemo(
    () => ({
      fromDate: getLocalDateInputValue(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)),
      toDate: getLocalDateInputValue(),
      size: 100,
      sort: ['attendanceDate,desc', 'checkInTime,desc'],
    }),
    []
  );

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

  const { data: myHistory = [], isLoading: isHistoryLoading } = useGetMyAttendanceHistory(
    myHistoryParams,
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

  const invalidateAttendanceQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.today }),
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/my/history'] }),
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/admin/records'] }),
    ]);
  };

  const checkInMutation = useCheckInAttendance({
    onSuccess: async () => {
      toast.success('Checked in successfully');
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

  const handleCheckIn = async () => {
    try {
      const location = await getCurrentLocation();

      checkInMutation.mutate(location);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to read location'));
    }
  };

  const handleCheckOut = async () => {
    try {
      const location = await getCurrentLocation();

      checkOutMutation.mutate(location);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to read location'));
    }
  };

  const isBusy = checkInMutation.isPending || checkOutMutation.isPending;
  const checkedIn = todayStatus?.checkedIn ?? false;
  const checkedOut = todayStatus?.checkedOut ?? false;

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
            isCheckInPending={checkInMutation.isPending}
            isCheckOutPending={checkOutMutation.isPending}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
          />

          <AttendanceMyHistoryCard rows={myHistory} isLoading={isHistoryLoading} />
        </>
      )}

      {adminAccess && (
        <AttendanceAdminCard
          adminDate={adminDate}
          onAdminDateChange={setAdminDate}
          rows={adminRecords}
          isLoading={isAdminLoading}
        />
      )}
    </div>
  );
}
