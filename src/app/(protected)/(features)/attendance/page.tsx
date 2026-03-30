'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRBAC } from '@/core/auth';
import {
  AttendanceAppointmentDTO,
  AttendanceLocationDTO,
  attendanceQueryKeys,
  useCheckInAttendanceAppointment,
  useCheckInAttendance,
  useGetAdminAttendanceAppointments,
  useCheckOutAttendanceAppointment,
  useCheckOutAttendance,
  useGetAdminAttendanceRecords,
  useGetMyActiveAttendanceAppointment,
  useGetMyAttendanceHistory,
  useGetMyTodayAttendance,
  useMarkLeaveAttendance,
} from '@/core/api/attendance';
import { useGetAllCalls } from '@/core/api/generated/spring/endpoints/call-resource/call-resource.gen';
import { useGetAllOrders } from '@/core/api/generated/spring/endpoints/order-resource/order-resource.gen';
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
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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

function getCameraErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return 'Camera permission denied. Please allow camera access.';
    }

    if (error.name === 'NotFoundError') {
      return 'No camera was found on this device.';
    }

    if (error.name === 'NotReadableError') {
      return 'The camera is already in use by another application.';
    }
  }

  return getErrorMessage(error, 'Unable to open the camera.');
}

function stopMediaStream(stream: MediaStream | null): void {
  stream?.getTracks().forEach((track) => track.stop());
}

async function capturePhotoFile(
  videoElement: HTMLVideoElement,
  canvasElement: HTMLCanvasElement
): Promise<File> {
  const width = videoElement.videoWidth;
  const height = videoElement.videoHeight;

  if (!width || !height) {
    throw new Error('Camera preview is not ready yet.');
  }

  canvasElement.width = width;
  canvasElement.height = height;

  const context = canvasElement.getContext('2d');

  if (!context) {
    throw new Error('Unable to access the image capture canvas.');
  }

  context.drawImage(videoElement, 0, 0, width, height);

  const imageBlob = await new Promise<Blob>((resolve, reject) => {
    canvasElement.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);

          return;
        }

        reject(new Error('Failed to capture the camera frame.'));
      },
      'image/jpeg',
      0.92
    );
  });

  return new File([imageBlob], `appointment-checkout-${Date.now()}.jpg`, {
    type: imageBlob.type || 'image/jpeg',
  });
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
  const [historyFromDate, setHistoryFromDate] = useState<string>(getDefaultWeeklyFromDateValue());
  const [historyToDate, setHistoryToDate] = useState<string>(getLocalDateInputValue());
  const [pendingWorkFromHomeCheckIn, setPendingWorkFromHomeCheckIn] =
    useState<PendingWorkFromHomeCheckIn | null>(null);
  const [isAppointmentCheckInDialogOpen, setIsAppointmentCheckInDialogOpen] = useState(false);
  const [isAppointmentCheckOutDialogOpen, setIsAppointmentCheckOutDialogOpen] = useState(false);
  const [selectedAppointmentLeadId, setSelectedAppointmentLeadId] = useState<string>('');
  const [selectedAppointmentOrderId, setSelectedAppointmentOrderId] = useState<string>('');
  const [appointmentRemark, setAppointmentRemark] = useState('');
  const [appointmentPhoto, setAppointmentPhoto] = useState<File | null>(null);
  const [appointmentPhotoPreviewUrl, setAppointmentPhotoPreviewUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const appointmentCameraVideoRef = useRef<HTMLVideoElement | null>(null);
  const appointmentCameraCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const appointmentCameraStreamRef = useRef<MediaStream | null>(null);

  const adminParams = useMemo(
    () => ({
      fromDate: adminDate,
      toDate: adminDate,
      size: 500,
      sort: ['attendanceDate,desc', 'checkInTime,desc'],
    }),
    [adminDate]
  );
  const adminAppointmentParams = useMemo(
    () => ({
      fromDate: adminDate,
      toDate: adminDate,
      size: 500,
      sort: ['appointmentDate,desc', 'checkInTime,desc'],
    }),
    [adminDate]
  );

  const { data: todayStatus, isLoading: isTodayLoading } = useGetMyTodayAttendance({
    query: { enabled: !adminAccess },
  });
  const { data: activeAppointment } = useGetMyActiveAttendanceAppointment({
    query: { enabled: !adminAccess },
  });

  const { data: leadOptionsResponse = [], isLoading: isLeadOptionsLoading } = useGetAllCalls(
    {
      'leadNo.specified': true,
      size: 200,
      sort: ['createdDate,desc'],
    },
    {
      query: {
        enabled: !adminAccess && isAppointmentCheckInDialogOpen,
      },
    }
  );

  const { data: orderOptionsResponse = [], isLoading: isOrderOptionsLoading } = useGetAllOrders(
    {
      size: 200,
      sort: ['id,desc'],
    },
    {
      query: {
        enabled: !adminAccess && isAppointmentCheckInDialogOpen,
      },
    }
  );

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
  const { data: adminAppointments = [], isLoading: isAdminAppointmentsLoading } =
    useGetAdminAttendanceAppointments(adminAppointmentParams, {
      query: { enabled: adminAccess },
    });

  const { data: organizationSettings } = useQuery({
    queryKey: ['attendance-organization-settings'],
    queryFn: getOrganizationSettings,
    enabled: !adminAccess,
    staleTime: 5 * 60 * 1000,
  });

  const invalidateAttendanceQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.today }),
      queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.activeAppointment }),
      queryClient.invalidateQueries({ queryKey: attendanceQueryKeys.appointmentHistory }),
      queryClient.invalidateQueries({
        queryKey: attendanceQueryKeys.adminAppointmentHistory(adminAppointmentParams),
      }),
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

  const appointmentCheckInMutation = useCheckInAttendanceAppointment({
    onSuccess: async (appointment) => {
      toast.success(`Appointment checked in for lead ${appointment.leadNo}`);
      setIsAppointmentCheckInDialogOpen(false);
      setSelectedAppointmentLeadId('');
      setSelectedAppointmentOrderId('');
      await invalidateAttendanceQueries();
    },
    onError: (error) => {
      toast.error(error?.message || 'Appointment check-in failed');
    },
  });

  const appointmentCheckOutMutation = useCheckOutAttendanceAppointment({
    onSuccess: async (appointment) => {
      toast.success(`Appointment checked out for lead ${appointment.leadNo}`);
      setIsAppointmentCheckOutDialogOpen(false);
      setAppointmentRemark('');
      setAppointmentPhoto(null);
      await invalidateAttendanceQueries();
    },
    onError: (error) => {
      toast.error(error?.message || 'Appointment check-out failed');
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

  const leadOptions = useMemo(
    () =>
      leadOptionsResponse
        .filter((lead) => typeof lead.id === 'number' && !!lead.leadNo)
        .map((lead) => ({
          id: String(lead.id),
          label: lead.leadNo!.trim(),
          title: lead.title?.trim() || 'Untitled lead',
        })),
    [leadOptionsResponse]
  );

  const orderOptions = useMemo(
    () =>
      orderOptionsResponse
        .filter((order) => typeof order.id === 'number')
        .map((order) => ({
          id: String(order.id),
          label: `Order #${order.id}`,
        })),
    [orderOptionsResponse]
  );

  useEffect(() => {
    if (!appointmentPhoto) {
      setAppointmentPhotoPreviewUrl(null);

      return;
    }

    const previewUrl = URL.createObjectURL(appointmentPhoto);

    setAppointmentPhotoPreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [appointmentPhoto]);

  const stopAppointmentCamera = () => {
    stopMediaStream(appointmentCameraStreamRef.current);
    appointmentCameraStreamRef.current = null;

    const videoElement = appointmentCameraVideoRef.current;

    if (videoElement) {
      videoElement.srcObject = null;
    }

    setIsCameraReady(false);
    setIsCameraStarting(false);
  };

  const startAppointmentCamera = async () => {
    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError('Camera access is not supported by this browser.');

      return;
    }

    const videoElement = appointmentCameraVideoRef.current;

    if (!videoElement) {
      setCameraError('Camera preview is not available right now.');

      return;
    }

    stopAppointmentCamera();
    setCameraError(null);
    setIsCameraStarting(true);
    setIsCameraReady(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: 'environment' },
        },
      });

      appointmentCameraStreamRef.current = stream;
      videoElement.srcObject = stream;

      await new Promise<void>((resolve) => {
        if (videoElement.readyState >= HTMLMediaElement.HAVE_METADATA) {
          resolve();

          return;
        }

        videoElement.onloadedmetadata = () => {
          videoElement.onloadedmetadata = null;
          resolve();
        };
      });

      await videoElement.play();

      setIsCameraReady(true);
    } catch (error: unknown) {
      stopAppointmentCamera();
      setCameraError(getCameraErrorMessage(error));
    } finally {
      setIsCameraStarting(false);
    }
  };

  useEffect(() => {
    if (!isAppointmentCheckOutDialogOpen) {
      stopAppointmentCamera();
      setCameraError(null);

      return;
    }

    if (!appointmentPhoto && !appointmentCameraStreamRef.current) {
      void startAppointmentCamera();
    }
  }, [appointmentPhoto, isAppointmentCheckOutDialogOpen]);

  useEffect(() => {
    return () => {
      stopMediaStream(appointmentCameraStreamRef.current);
    };
  }, []);

  const isBusy =
    checkInMutation.isPending ||
    checkOutMutation.isPending ||
    leaveMutation.isPending ||
    appointmentCheckInMutation.isPending ||
    appointmentCheckOutMutation.isPending;
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

  const openAppointmentCheckInDialog = () => {
    setSelectedAppointmentLeadId('');
    setSelectedAppointmentOrderId('');
    setIsAppointmentCheckInDialogOpen(true);
  };

  const openAppointmentCheckOutDialog = () => {
    setAppointmentRemark('');
    setAppointmentPhoto(null);
    setCameraError(null);
    setIsAppointmentCheckOutDialogOpen(true);
  };

  const handleCaptureAppointmentPhoto = async () => {
    const videoElement = appointmentCameraVideoRef.current;
    const canvasElement = appointmentCameraCanvasRef.current;

    if (!videoElement || !canvasElement) {
      toast.error('Camera preview is not ready yet');

      return;
    }

    try {
      const photoFile = await capturePhotoFile(videoElement, canvasElement);

      setAppointmentPhoto(photoFile);
      setCameraError(null);
      stopAppointmentCamera();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to capture photo'));
    }
  };

  const handleRetakeAppointmentPhoto = () => {
    setAppointmentPhoto(null);
    setCameraError(null);
  };

  const handleAppointmentCheckIn = async () => {
    if (!selectedAppointmentLeadId) {
      toast.error('Please select a lead number');

      return;
    }

    if (!selectedAppointmentOrderId) {
      toast.error('Please select an order number');

      return;
    }

    try {
      const location = await getCurrentLocation();

      appointmentCheckInMutation.mutate({
        ...location,
        leadId: Number(selectedAppointmentLeadId),
        orderId: Number(selectedAppointmentOrderId),
      });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to read location'));
    }
  };

  const handleAppointmentCheckOut = async () => {
    if (!activeAppointment) {
      toast.error('There is no active appointment to check out');

      return;
    }

    if (!appointmentPhoto) {
      toast.error('Please capture a photo before checking out');

      return;
    }

    if (!appointmentRemark.trim()) {
      toast.error('Please add a remark before checking out');

      return;
    }

    try {
      const location = await getCurrentLocation();

      appointmentCheckOutMutation.mutate({
        ...location,
        remark: appointmentRemark.trim(),
        photo: appointmentPhoto,
      });
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'Failed to read location'));
    }
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
            activeAppointment={activeAppointment as AttendanceAppointmentDTO | null}
            isAppointmentCheckInPending={appointmentCheckInMutation.isPending}
            isAppointmentCheckOutPending={appointmentCheckOutMutation.isPending}
            appointmentHistoryHref="/attendance/appointments"
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onLeave={handleMarkLeave}
            onAppointmentCheckIn={openAppointmentCheckInDialog}
            onAppointmentCheckOut={openAppointmentCheckOutDialog}
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
          attendanceRows={adminRecords}
          appointmentRows={adminAppointments}
          isAttendanceLoading={isAdminLoading}
          isAppointmentLoading={isAdminAppointmentsLoading}
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

      <Dialog
        open={isAppointmentCheckInDialogOpen}
        onOpenChange={(open) => {
          setIsAppointmentCheckInDialogOpen(open);
          if (!open) {
            setSelectedAppointmentLeadId('');
            setSelectedAppointmentOrderId('');
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Check In Appointment</DialogTitle>
            <DialogDescription>
              Select the lead no and order no for this appointment. The system will save them with
              your live location.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="appointment-lead-select">Lead No</Label>
              <Select
                value={selectedAppointmentLeadId}
                onValueChange={setSelectedAppointmentLeadId}
              >
                <SelectTrigger id="appointment-lead-select" className="w-full">
                  <SelectValue
                    placeholder={
                      isLeadOptionsLoading ? 'Loading lead numbers...' : 'Select lead number'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {leadOptions.length > 0 ? (
                    leadOptions.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.label} | {lead.title}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no-leads__" disabled>
                      No lead numbers available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="appointment-order-select">Order No</Label>
              <Select
                value={selectedAppointmentOrderId}
                onValueChange={setSelectedAppointmentOrderId}
              >
                <SelectTrigger id="appointment-order-select" className="w-full">
                  <SelectValue
                    placeholder={
                      isOrderOptionsLoading ? 'Loading orders...' : 'Select order number'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {orderOptions.length > 0 ? (
                    orderOptions.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.label}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="__no-orders__" disabled>
                      No orders available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAppointmentCheckInDialogOpen(false)}
              disabled={appointmentCheckInMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAppointmentCheckIn}
              disabled={appointmentCheckInMutation.isPending}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {appointmentCheckInMutation.isPending ? 'Checking In...' : 'Check In Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isAppointmentCheckOutDialogOpen}
        onOpenChange={(open) => {
          setIsAppointmentCheckOutDialogOpen(open);
          if (!open) {
            setAppointmentRemark('');
            setAppointmentPhoto(null);
            setCameraError(null);
            stopAppointmentCamera();
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Check Out Appointment</DialogTitle>
            <DialogDescription>
              Capture a live photo and add a remark. The remark will also be saved against the
              selected lead from appointment check-in.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            {activeAppointment ? (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                <p>
                  <span className="font-medium">Lead No:</span> {activeAppointment.leadNo}
                </p>
                <p>
                  <span className="font-medium">Order No:</span> #{activeAppointment.orderId}
                </p>
              </div>
            ) : null}

            <div className="grid gap-2">
              <Label>Photo</Label>
              <div className="overflow-hidden rounded-md border bg-black">
                {appointmentPhotoPreviewUrl ? (
                  <Image
                    src={appointmentPhotoPreviewUrl}
                    alt="Appointment checkout preview"
                    width={800}
                    height={384}
                    unoptimized
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <video
                    ref={appointmentCameraVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-48 w-full object-cover"
                  />
                )}
              </div>
              <canvas ref={appointmentCameraCanvasRef} className="hidden" />
              <p className="text-muted-foreground text-xs">
                The camera opens automatically. Capture a live photo on-site to complete appointment
                checkout.
              </p>
              {cameraError ? <p className="text-destructive text-xs">{cameraError}</p> : null}
              {appointmentPhotoPreviewUrl ? (
                <p className="text-xs text-emerald-700">Photo captured. Retake it if needed.</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {appointmentPhotoPreviewUrl ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRetakeAppointmentPhoto}
                    disabled={appointmentCheckOutMutation.isPending}
                  >
                    Retake Photo
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleCaptureAppointmentPhoto()}
                    disabled={
                      appointmentCheckOutMutation.isPending || isCameraStarting || !isCameraReady
                    }
                  >
                    {isCameraStarting
                      ? 'Opening Camera...'
                      : isCameraReady
                        ? 'Capture Photo'
                        : 'Preparing Camera...'}
                  </Button>
                )}
                {!appointmentPhotoPreviewUrl ? (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => void startAppointmentCamera()}
                    disabled={appointmentCheckOutMutation.isPending || isCameraStarting}
                  >
                    Retry Camera
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="appointment-remark">Remark</Label>
              <Textarea
                id="appointment-remark"
                value={appointmentRemark}
                onChange={(event) => setAppointmentRemark(event.target.value)}
                placeholder="Add the appointment visit summary"
                rows={5}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAppointmentCheckOutDialogOpen(false)}
              disabled={appointmentCheckOutMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAppointmentCheckOut}
              disabled={appointmentCheckOutMutation.isPending || !activeAppointment}
              className="bg-violet-600 text-white hover:bg-violet-700"
            >
              {appointmentCheckOutMutation.isPending ? 'Checking Out...' : 'Check Out Appointment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
