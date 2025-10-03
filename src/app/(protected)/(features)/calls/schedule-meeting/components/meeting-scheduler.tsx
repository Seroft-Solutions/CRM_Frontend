'use client';

import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import Calendar20 from '@/components/calendar-20';
import { Separator } from '@/components/ui/separator';
import {
  CalendarDays,
  Video,
  Bell,
  Clock,
  Plus,
  X,
  Sparkles,
} from 'lucide-react';
import { format, addMinutes } from 'date-fns';
import { cn } from '@/lib/utils';
import './meeting-scheduler.css';
import { MeetingErrorDialog } from '@/app/(protected)/(features)/calls/schedule-meeting/components/meeting-error-dialog';
import { useUserAvailabilityCreation } from '@/app/(protected)/(features)/shared/services/customer-availability-service';

// Backend imports
import {
  useCreateMeeting,
  useGetAllMeetings,
} from '@/core/api/generated/spring/endpoints/meeting-resource/meeting-resource.gen';
import { useCreateMeetingParticipant } from '@/core/api/generated/spring/endpoints/meeting-participant-resource/meeting-participant-resource.gen';
import { useCreateMeetingReminder } from '@/core/api/generated/spring/endpoints/meeting-reminder-resource/meeting-reminder-resource.gen';
import {
  useGetAllAvailableTimeSlots,
  useUpdateAvailableTimeSlot,
} from '@/core/api/generated/spring/endpoints/available-time-slot-resource/available-time-slot-resource.gen';
import { useGetAllUserAvailabilities } from '@/core/api/generated/spring/endpoints/user-availability-resource/user-availability-resource.gen';

import {
  MeetingDTOMeetingType,
  MeetingDTOMeetingStatus,
  MeetingReminderDTOReminderType,
} from '@/core/api/generated/spring/schemas';
import type {
  MeetingDTO,
  MeetingParticipantDTO,
  MeetingReminderDTO,
} from '@/core/api/generated/spring/schemas';
import { useGetCustomer } from '@/core/api/generated/spring';

interface MeetingDetails {
  title: string;
  description: string;
  duration: number;
  meetingType: 'VIRTUAL' | 'IN_PERSON' | 'PHONE_CALL';
  meetingUrl?: string;
  location?: string;
}

interface ParticipantDetails {
  email: string;
  name: string;
  isRequired: boolean;
}

interface ReminderDetails {
  enabled: boolean;
  type: 'EMAIL' | 'SMS' | 'PUSH_NOTIFICATION';
  minutesBefore: number;
}

interface MeetingSchedulerProps {
  customerId?: number;
  assignedUserId?: string; // Can be either number ID or string UUID
  callId?: number;
  onMeetingScheduledAction: (meetingData: any) => void;
  onError?: (error: any) => void;
  disabled?: boolean;
}

export function MeetingScheduler({
  customerId,
  assignedUserId,
  callId,
  onMeetingScheduledAction,
  onError,
  disabled = false,
}: MeetingSchedulerProps) {
  const { ensureUserHasAvailability } = useUserAvailabilityCreation();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [meetingDetails, setMeetingDetails] = useState<MeetingDetails>({
    title: '',
    description: '',
    duration: 30,
    meetingType: 'VIRTUAL',
    meetingUrl: 'https://meet.google.com/',
    location: '',
  });
  const [participants, setParticipants] = useState<ParticipantDetails[]>([]);
  const [reminders, setReminders] = useState<ReminderDetails[]>([
    { enabled: true, type: 'EMAIL', minutesBefore: 15 },
  ]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);
  const [bookedTimeSlots, setBookedTimeSlots] = useState<string[]>([]); // New state for booked time slots

  // Error handling state
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const { data: customerData } = useGetCustomer(customerId || 0, {
    query: { enabled: !!customerId },
  });

  // Backend hooks
  const { mutate: createMeeting, isPending: isCreating } = useCreateMeeting({
    mutation: {
      onSuccess: async (meetingData) => {
        try {
          // Mark the corresponding time slot as booked
          if (selectedDate && selectedTime && assignedUserId && timeSlots) {
            const meetingDateTime = new Date(selectedDate);
            const [hours, minutes] = selectedTime.split(':').map(Number);
            meetingDateTime.setHours(hours, minutes, 0, 0);

            // Find the matching time slot
            const matchingSlot = timeSlots.find((slot) => {
              const slotDateTime = new Date(slot.slotDateTime);
              const userIdMatch = slot.user?.id?.toString() === assignedUserId?.toString();
              return slotDateTime.getTime() === meetingDateTime.getTime() && userIdMatch;
            });

            if (matchingSlot) {
              // Update the slot to mark it as booked
              updateAvailableTimeSlot({
                id: matchingSlot.id!,
                data: {
                  ...matchingSlot,
                  isBooked: true,
                  bookedAt: new Date().toISOString(),
                },
              });
              console.log('✅ Time slot marked as booked:', matchingSlot.id);
            } else {
              console.warn('⚠️ Could not find matching time slot to mark as booked');
            }
          }

          if (participants.length > 0) {
            await Promise.all(
              participants.map((participant) =>
                createMeetingParticipant({
                  data: {
                    email: participant.email,
                    name: participant.name,
                    isRequired: participant.isRequired,
                    hasAccepted: false,
                    hasDeclined: false,
                    status: 'ACTIVE',
                    meeting: meetingData,
                  },
                })
              )
            );
          }

          const enabledReminders = reminders.filter((r) => r.enabled);
          if (enabledReminders.length > 0) {
            await Promise.all(
              enabledReminders.map((reminder) =>
                createMeetingReminder({
                  data: {
                    reminderType: reminder.type as keyof typeof MeetingReminderDTOReminderType,
                    reminderMinutesBefore: reminder.minutesBefore,
                    meeting: meetingData,
                    status: 'ACTIVE',
                  },
                })
              )
            );
          }

          // Invalidate all related caches to show updated data immediately
          console.log('🔄 Invalidating caches to refresh data...');
          await Promise.all([
            // Invalidate meetings cache
            queryClient.invalidateQueries({
              queryKey: ['useGetAllMeetings'],
              exact: false,
            }),
            // Invalidate available time slots cache
            queryClient.invalidateQueries({
              queryKey: ['useGetAllAvailableTimeSlots'],
              exact: false,
            }),
            // Invalidate user availabilities cache
            queryClient.invalidateQueries({
              queryKey: ['useGetAllUserAvailabilities'],
              exact: false,
            }),
            // Invalidate calls cache (if user navigates back)
            queryClient.invalidateQueries({
              queryKey: ['useGetAllCalls'],
              exact: false,
            }),
          ]);
          console.log('✅ All caches invalidated - fresh data will be loaded');

          onMeetingScheduledAction(meetingData);
        } catch (error) {
          // Handle errors in participant/reminder creation
          console.error('Error in post-meeting creation steps:', error);
          setErrorMessage(
            'Meeting was created but some participants or reminders could not be set up. Please check the meeting details.'
          );
          setShowErrorDialog(true);
          onError?.(error);
        }
      },
      onError: (error) => {
        console.error('Failed to create meeting:', error);
        setErrorMessage(
          error?.message ||
            'We encountered an unexpected error while scheduling your meeting. Please try again or contact support if the issue persists.'
        );
        setShowErrorDialog(true);
        onError?.(error);
      },
    },
  });

  const { mutate: createMeetingParticipant } = useCreateMeetingParticipant();
  const { mutate: createMeetingReminder } = useCreateMeetingReminder();
  const { mutate: updateAvailableTimeSlot } = useUpdateAvailableTimeSlot({
    mutation: {
      onSuccess: () => {
        // Invalidate time slots cache when a slot is updated
        queryClient.invalidateQueries({
          queryKey: ['useGetAllAvailableTimeSlots'],
          exact: false,
        });
        console.log('✅ Time slot cache invalidated after booking');
      },
    },
  });

  // Get data from backend
  const { data: timeSlots } = useGetAllAvailableTimeSlots(
    assignedUserId
      ? { 'userId.equals': assignedUserId.toString(), 'isBooked.equals': false }
      : undefined,
    {
      query: {
        enabled: !!assignedUserId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false,
      },
    }
  );

  const { data: userAvailabilities } = useGetAllUserAvailabilities(
    assignedUserId ? { 'userId.equals': assignedUserId.toString() } : undefined,
    {
      query: {
        enabled: !!assignedUserId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false,
      },
    }
  );

  const { data: existingMeetings } = useGetAllMeetings(
    assignedUserId ? { 'organizerId.equals': assignedUserId.toString() } : undefined,
    {
      query: {
        enabled: !!assignedUserId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        cacheTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        refetchInterval: false,
      },
    }
  );

  // Initialize default participant
  useEffect(() => {
    if (customerData && participants.length === 0) {
      setParticipants([
        {
          email: customerData.email || '',
          name: customerData.customerBusinessName || '',
          isRequired: true,
        },
      ]);
    }

    if (customerData && !meetingDetails.title) {
      setMeetingDetails((prev) => ({
        ...prev,
        title: `Follow-up Meeting with ${customerData.customerBusinessName || 'Customer'}`,
      }));
    }
  }, [customerData, participants.length, meetingDetails.title]);

  // Ensure assigned user has availability (memoized to prevent infinite calls)
  useEffect(() => {
    if (assignedUserId) {
      ensureUserHasAvailability(assignedUserId).then((success) => {
        if (success) {
          console.log('✅ User availability confirmed for:', assignedUserId);
        } else {
          console.error('❌ Failed to ensure user availability for:', assignedUserId);
        }
      });
    }
  }, [assignedUserId]); // Removed ensureUserHasAvailability from dependencies to prevent infinite loop

  // Process available time slots
  useEffect(() => {
    const slots: string[] = [];

    if (timeSlots && userAvailabilities) {
      timeSlots.forEach((slot) => {
        if (!slot.isBooked) {
          const slotTime = new Date(slot.slotDateTime);
          const timeString = format(slotTime, 'HH:mm');
          if (!slots.includes(timeString)) {
            slots.push(timeString);
          }
        }
      });

      userAvailabilities.forEach((availability) => {
        if (availability.isAvailable) {
          const [startHour, startMin] = availability.startTime.split(':').map(Number);
          const [endHour, endMin] = availability.endTime.split(':').map(Number);

          let currentHour = startHour;
          let currentMin = startMin;

          while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
            const timeSlot = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
            if (!slots.includes(timeSlot)) {
              slots.push(timeSlot);
            }

            currentMin += 30;
            if (currentMin >= 60) {
              currentMin = 0;
              currentHour += 1;
            }
          }
        }
      });
    }

    // Log what data sources we're using
    console.log('📊 Time slot sources:', {
      fromAvailableTimeSlots: timeSlots?.length || 0,
      fromUserAvailabilities: userAvailabilities?.length || 0,
      totalGenerated: slots.length,
      assignedUserId,
    });

    // Only use default time slots if absolutely no data exists
    if (slots.length === 0) {
      console.warn('⚠️ No availability data found in database - using fallback slots');
      for (let hour = 9; hour <= 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          if (hour === 17 && minute > 0) break;
          const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          slots.push(timeSlot);
        }
      }
    } else {
      console.log('✅ Using real availability data from database');
    }

    setAvailableTimeSlots(slots.sort());
  }, [timeSlots, userAvailabilities]);

  // Process booked dates
  useEffect(() => {
    if (existingMeetings) {
      const booked = existingMeetings
        .filter(
          (meeting) =>
            meeting.meetingStatus === MeetingDTOMeetingStatus.SCHEDULED ||
            meeting.meetingStatus === MeetingDTOMeetingStatus.CONFIRMED
        )
        .map((meeting) => new Date(meeting.meetingDateTime));

      setBookedDates(booked);
    }
  }, [existingMeetings]);

  // Process booked time slots for the selected date
  useEffect(() => {
    if (existingMeetings && selectedDate) {
      const selectedDateStr = selectedDate.toDateString();
      const bookedSlotsForDate = existingMeetings
        .filter((meeting) => {
          if (!meeting.meetingDateTime) return false;
          const meetingDate = new Date(meeting.meetingDateTime);
          const isScheduledOrConfirmed =
            meeting.meetingStatus === MeetingDTOMeetingStatus.SCHEDULED ||
            meeting.meetingStatus === MeetingDTOMeetingStatus.CONFIRMED;
          return isScheduledOrConfirmed && meetingDate.toDateString() === selectedDateStr;
        })
        .map((meeting) => {
          const meetingDate = new Date(meeting.meetingDateTime);
          return format(meetingDate, 'HH:mm');
        });

      setBookedTimeSlots(bookedSlotsForDate);
    } else {
      setBookedTimeSlots([]);
    }
  }, [existingMeetings, selectedDate]);

  const scheduleMeeting = async () => {
    if (!selectedDate || !selectedTime || !assignedUserId || !callId) return;

    const meetingDateTime = new Date(selectedDate);
    const [hours, minutes] = selectedTime.split(':').map(Number);
    meetingDateTime.setHours(hours, minutes, 0, 0);

    const meetingData: MeetingDTO = {
      meetingDateTime: meetingDateTime.toISOString(),
      duration: meetingDetails.duration,
      title: meetingDetails.title,
      description: meetingDetails.description,
      meetingType: MeetingDTOMeetingType.VIRTUAL,
      meetingUrl: meetingDetails.meetingUrl,
      notes: '',
      isRecurring: false,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      meetingStatus: MeetingDTOMeetingStatus.SCHEDULED,
      organizer: { id: assignedUserId } as any,
      assignedCustomer: customerId ? ({ id: customerId } as any) : undefined,
      call: { id: callId } as any,
      status: 'ACTIVE',
    };

    createMeeting({ data: meetingData });
  };

  const handleRetryScheduling = () => {
    setErrorMessage('');
    scheduleMeeting();
  };

  const canScheduleMeeting = () => {
    return (
      selectedDate &&
      selectedTime &&
      meetingDetails.title.trim().length > 0 &&
      participants.every((p) => p.email && p.name)
    );
  };

  if (disabled || !assignedUserId) {
    return (
      <Card className="opacity-50">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            Please select a customer and assigned user to enable meeting scheduling
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <CardContent className="space-y-8 p-8">
          {/* Participants Section - Moved to First */}
          <div className="space-y-4">
            <div className="rounded-lg border">
              <div className="flex items-center justify-between p-3">
                <h4 className="font-medium text-lg">Meeting Details</h4>
              </div>
              <div className="p-3 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Meeting Title *</Label>
                    <Input
                        id="title"
                        placeholder="Enter meeting title"
                        value={meetingDetails.title}
                        onChange={(e) =>
                            setMeetingDetails((prev) => ({ ...prev, title: e.target.value }))
                        }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Select
                        value={meetingDetails.duration.toString()}
                        onValueChange={(value) =>
                            setMeetingDetails((prev) => ({ ...prev, duration: parseInt(value) }))
                        }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="45">45 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="90">1.5 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                      id="description"
                      placeholder="Add meeting agenda or notes..."
                      value={meetingDetails.description}
                      onChange={(e) =>
                          setMeetingDetails((prev) => ({ ...prev, description: e.target.value }))
                      }
                      rows={3}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between p-3">
                <h4 className="font-medium text-lg">Meeting Participants</h4>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() =>
                    setParticipants((prev) => [...prev, { email: '', name: '', isRequired: false }])
                  }
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Participant
                </Button>
              </div>

              <div className="divide-y">
                {participants.map((participant, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-3 items-end p-3"
                  >
                    <div className="col-span-5">
                      <Label>Email</Label>
                      <Input
                        placeholder="email@example.com"
                        value={participant.email}
                        onChange={(e) => {
                          const newParticipants = [...participants];
                          newParticipants[index].email = e.target.value;
                          setParticipants(newParticipants);
                        }}
                      />
                    </div>
                    <div className="col-span-4">
                      <Label>Name</Label>
                      <Input
                        placeholder="Full Name"
                        value={participant.name}
                        onChange={(e) => {
                          const newParticipants = [...participants];
                          newParticipants[index].name = e.target.value;
                          setParticipants(newParticipants);
                        }}
                      />
                    </div>
                    <div className="col-span-2 flex items-center space-x-2">
                      <Checkbox
                        checked={participant.isRequired}
                        onCheckedChange={(checked) => {
                          const newParticipants = [...participants];
                          newParticipants[index].isRequired = checked as boolean;
                          setParticipants(newParticipants);
                        }}
                      />
                      <Label className="text-xs">Required</Label>
                    </div>
                    <div className="col-span-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setParticipants((prev) => prev.filter((_, i) => i !== index))}
                        disabled={index === 0 && customerData?.email === participant.email}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Date & Time Section */}
          <div className="rounded-lg border">
            <div className="flex items-center justify-between p-3">
              <h4 className="font-medium text-lg">Select Date & Time</h4>
            </div>
            <div className="p-3">
              <div className="flex justify-center">
                <div className="max-w-xl w-full">
                  <Calendar20
                    compact
                    onDateTimeSelected={(date: Date, time: string) => {
                      setSelectedDate(date);
                      setSelectedTime(time);
                    }}
                    bookedDates={bookedDates}
                    availableTimeSlots={availableTimeSlots}
                    bookedTimeSlots={bookedTimeSlots}
                    initialDate={selectedDate}
                    initialTime={selectedTime}
                    showContinueButton={false}
                    disabled={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="bg-gray-50 px-8 py-6 border-t">
          <Button
            onClick={scheduleMeeting}
            disabled={isCreating || !canScheduleMeeting()}
            className="ml-auto h-11 px-6 bg-green-600 hover:bg-green-700"
          >
            {isCreating ? (
              <>Scheduling...</>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Schedule Meeting
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* Meeting Error Dialog */}
      <MeetingErrorDialog
        open={showErrorDialog}
        onOpenChange={setShowErrorDialog}
        onRetry={handleRetryScheduling}
        errorMessage={errorMessage}
        redirectToCalls={true}
      />
    </div>
  );
}
