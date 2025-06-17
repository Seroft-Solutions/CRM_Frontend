"use client";

import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarDays, Video, Phone, MapPin, Users, Bell } from "lucide-react";
import { format } from "date-fns";
import Calendar20 from "@/components/calendar-20";

// Import backend hooks
import { 
  useCreateMeeting,
  useGetAllMeetings 
} from "@/core/api/generated/spring/endpoints/meeting-resource/meeting-resource.gen";
import { 
  useCreateMeetingParticipant 
} from "@/core/api/generated/spring/endpoints/meeting-participant-resource/meeting-participant-resource.gen";
import { 
  useCreateMeetingReminder 
} from "@/core/api/generated/spring/endpoints/meeting-reminder-resource/meeting-reminder-resource.gen";
import { 
  useGetAllAvailableTimeSlots 
} from "@/core/api/generated/spring/endpoints/available-time-slot-resource/available-time-slot-resource.gen";
import { useGetAllUserAvailabilities } from "@/core/api/generated/spring/endpoints/user-availability-resource/user-availability-resource.gen";

import { 
  MeetingDTOMeetingType, 
  MeetingDTOMeetingStatus,
  MeetingReminderDTOReminderType 
} from "@/core/api/generated/spring/schemas";
import type { 
  MeetingDTO,
  MeetingParticipantDTO,
  MeetingReminderDTO 
} from "@/core/api/generated/spring/schemas";

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
  partyId?: number;
  partyName?: string;
  partyEmail?: string;
  assignedUserId?: number;
  onMeetingScheduled: (meetingData: any) => void;
  disabled?: boolean;
}

export function MeetingScheduler({
  partyId,
  partyName,
  partyEmail,
  assignedUserId,
  onMeetingScheduled,
  disabled = false
}: MeetingSchedulerProps) {
  const [meetingDetails, setMeetingDetails] = useState<MeetingDetails>({
    title: '',
    description: '',
    duration: 30,
    meetingType: 'VIRTUAL',
    meetingUrl: '',
    location: ''
  });
  const [selectedDateTime, setSelectedDateTime] = useState<{ date: Date; time: string } | null>(null);
  const [participants, setParticipants] = useState<ParticipantDetails[]>([]);
  const [reminders, setReminders] = useState<ReminderDetails[]>([
    { enabled: true, type: 'EMAIL', minutesBefore: 15 }
  ]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);

  const titleSuggestions = [
    `Catchup Meeting with ${partyName || 'Party'}`,
    `Follow-up Discussion with ${partyName || 'Party'}`,
    `Strategy Meeting with ${partyName || 'Party'}`,
    `Project Review with ${partyName || 'Party'}`,
    `Business Discussion with ${partyName || 'Party'}`,
    `Consultation with ${partyName || 'Party'}`,
  ];

  // Backend hooks
  const { mutate: createMeeting, isPending: isCreating } = useCreateMeeting({
    mutation: {
      onSuccess: async (meetingData) => {
        // Create participants after meeting is created
        if (participants.length > 0) {
          await Promise.all(
            participants.map(participant =>
              createMeetingParticipant({
                data: {
                  email: participant.email,
                  name: participant.name,
                  isRequired: participant.isRequired,
                  hasAccepted: false,
                  hasDeclined: false,
                  meeting: meetingData
                }
              })
            )
          );
        }

        // Create reminders if enabled
        const enabledReminders = reminders.filter(r => r.enabled);
        if (enabledReminders.length > 0) {
          await Promise.all(
            enabledReminders.map(reminder =>
              createMeetingReminder({
                data: {
                  reminderType: reminder.type as keyof typeof MeetingReminderDTOReminderType,
                  reminderDateTime: new Date(
                    new Date(meetingData.meetingDateTime).getTime() - 
                    (reminder.minutesBefore * 60 * 1000)
                  ).toISOString(),
                  isSent: false,
                  meeting: meetingData
                }
              })
            )
          );
        }

        onMeetingScheduled(meetingData);
        resetForm();
      },
      onError: (error) => {
        console.error('Failed to create meeting:', error);
      },
    },
  });

  const { mutate: createMeetingParticipant } = useCreateMeetingParticipant();
  const { mutate: createMeetingReminder } = useCreateMeetingReminder();

  // Get available time slots
  const { data: timeSlots } = useGetAllAvailableTimeSlots(
    assignedUserId ? { 'user.id': assignedUserId, isBooked: false } : undefined,
    {
      query: { enabled: !!assignedUserId }
    }
  );

  // Get user availability
  const { data: userAvailabilities } = useGetAllUserAvailabilities(
    assignedUserId ? { 'user.id': assignedUserId } : undefined,
    {
      query: { enabled: !!assignedUserId }
    }
  );

  // Get existing meetings to determine booked slots
  const { data: existingMeetings } = useGetAllMeetings(
    assignedUserId ? { 'organizer.id': assignedUserId } : undefined,
    {
      query: { enabled: !!assignedUserId }
    }
  );

  // Initialize default participant if party email is available
  useEffect(() => {
    if (partyEmail && participants.length === 0) {
      setParticipants([{
        email: partyEmail,
        name: partyName || '',
        isRequired: true
      }]);
    }
  }, [partyEmail, partyName, participants.length]);

  // Process available time slots and user availability
  useEffect(() => {
    if (timeSlots && userAvailabilities) {
      const slots: string[] = [];
      
      // Combine time slots from both sources
      timeSlots.forEach(slot => {
        if (!slot.isBooked) {
          const slotTime = new Date(slot.slotDateTime);
          const timeString = format(slotTime, 'HH:mm');
          if (!slots.includes(timeString)) {
            slots.push(timeString);
          }
        }
      });

      // Add availability-based slots
      userAvailabilities.forEach(availability => {
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
      
      setAvailableTimeSlots(slots.sort());
    }
  }, [timeSlots, userAvailabilities]);

  // Process booked dates from existing meetings
  useEffect(() => {
    if (existingMeetings) {
      const booked = existingMeetings
        .filter(meeting => 
          meeting.meetingStatus === MeetingDTOMeetingStatus.SCHEDULED || 
          meeting.meetingStatus === MeetingDTOMeetingStatus.CONFIRMED
        )
        .map(meeting => new Date(meeting.meetingDateTime));
      
      setBookedDates(booked);
    }
  }, [existingMeetings]);

  const handleDateTimeSelection = (date: Date, time: string) => {
    setSelectedDateTime({ date, time });
  };

  const addParticipant = () => {
    setParticipants(prev => [...prev, { email: '', name: '', isRequired: false }]);
  };

  const updateParticipant = (index: number, field: keyof ParticipantDetails, value: any) => {
    setParticipants(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const removeParticipant = (index: number) => {
    setParticipants(prev => prev.filter((_, i) => i !== index));
  };

  const updateReminder = (index: number, field: keyof ReminderDetails, value: any) => {
    setReminders(prev => prev.map((r, i) => i === index ? { ...r, [field]: value } : r));
  };

  const addReminder = () => {
    setReminders(prev => [...prev, { enabled: true, type: 'EMAIL', minutesBefore: 60 }]);
  };

  const resetForm = () => {
    setSelectedDateTime(null);
    setMeetingDetails({
      title: '',
      description: '',
      duration: 30,
      meetingType: 'VIRTUAL',
      meetingUrl: '',
      location: ''
    });
    setParticipants(partyEmail ? [{
      email: partyEmail,
      name: partyName || '',
      isRequired: true
    }] : []);
    setReminders([{ enabled: true, type: 'EMAIL', minutesBefore: 15 }]);
  };

  const scheduleMeeting = async () => {
    if (!selectedDateTime || !assignedUserId) return;

    const meetingDateTime = new Date(selectedDateTime.date);
    const [hours, minutes] = selectedDateTime.time.split(':').map(Number);
    meetingDateTime.setHours(hours, minutes, 0, 0);

    const meetingData: MeetingDTO = {
      meetingDateTime: meetingDateTime.toISOString(),
      duration: meetingDetails.duration,
      title: meetingDetails.title || titleSuggestions[0],
      description: meetingDetails.description,
      meetingType: meetingDetails.meetingType as keyof typeof MeetingDTOMeetingType,
      meetingUrl: meetingDetails.meetingUrl,
      notes: '',
      isRecurring: false,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      meetingStatus: MeetingDTOMeetingStatus.SCHEDULED,
      organizer: { id: assignedUserId },
      assignedParty: partyId ? { id: partyId } : undefined,
    };

    createMeeting({ data: meetingData });
  };

  if (disabled || !assignedUserId) {
    return (
      <Card className="opacity-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Meeting Scheduler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Please select a party and assigned user to enable meeting scheduling
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Party Info */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 text-lg font-semibold">
          <CalendarDays className="h-5 w-5 text-primary" />
          Schedule Meeting
        </div>
        <div className="text-muted-foreground text-sm space-y-1">
          <p>Schedule a follow-up meeting with</p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="font-medium">
              {partyName || 'Selected Party'}
            </Badge>
            {partyEmail && (
              <Badge variant="secondary" className="text-xs">
                {partyEmail}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <Calendar20
        onDateTimeSelected={handleDateTimeSelection}
        bookedDates={bookedDates}
        availableTimeSlots={availableTimeSlots}
        showContinueButton={false}
        disabled={disabled}
      />

      {/* Meeting Details Form */}
      {selectedDateTime && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meeting Details</CardTitle>
              <p className="text-sm text-muted-foreground">
                Selected: {format(selectedDateTime.date, "EEEE, MMMM d, yyyy")} at {selectedDateTime.time}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Meeting Title</Label>
                  <Input
                    id="title"
                    placeholder={titleSuggestions[0]}
                    value={meetingDetails.title}
                    onChange={(e) => setMeetingDetails(prev => ({ ...prev, title: e.target.value }))}
                  />
                  {/* Title Suggestions */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {titleSuggestions.slice(0, 3).map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => setMeetingDetails(prev => ({ ...prev, title: suggestion }))}
                      >
                        {suggestion.length > 25 ? `${suggestion.substring(0, 25)}...` : suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select
                    value={meetingDetails.duration.toString()}
                    onValueChange={(value) => setMeetingDetails(prev => ({ ...prev, duration: parseInt(value) }))}
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
                      <SelectItem value="120">2 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Meeting Type</Label>
                <Select
                  value={meetingDetails.meetingType}
                  onValueChange={(value: 'VIRTUAL' | 'IN_PERSON' | 'PHONE_CALL') => 
                    setMeetingDetails(prev => ({ ...prev, meetingType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VIRTUAL">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4" />
                        Virtual Meeting
                      </div>
                    </SelectItem>
                    <SelectItem value="PHONE_CALL">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone Call
                      </div>
                    </SelectItem>
                    <SelectItem value="IN_PERSON">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        In Person
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {meetingDetails.meetingType === 'VIRTUAL' && (
                <div className="space-y-2">
                  <Label htmlFor="meetingUrl">Meeting URL (optional)</Label>
                  <Input
                    id="meetingUrl"
                    placeholder="https://meet.google.com/..."
                    value={meetingDetails.meetingUrl}
                    onChange={(e) => setMeetingDetails(prev => ({ ...prev, meetingUrl: e.target.value }))}
                  />
                </div>
              )}

              {meetingDetails.meetingType === 'IN_PERSON' && (
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="Enter meeting location"
                    value={meetingDetails.location}
                    onChange={(e) => setMeetingDetails(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add meeting agenda or notes..."
                  value={meetingDetails.description}
                  onChange={(e) => setMeetingDetails(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Participants */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Participants
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {participants.map((participant, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Label>Email</Label>
                    <Input
                      placeholder="email@example.com"
                      value={participant.email}
                      onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                    />
                  </div>
                  <div className="col-span-4">
                    <Label>Name</Label>
                    <Input
                      placeholder="Full Name"
                      value={participant.name}
                      onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 flex items-center space-x-2">
                    <Checkbox
                      checked={participant.isRequired}
                      onCheckedChange={(checked) => updateParticipant(index, 'isRequired', checked)}
                    />
                    <Label className="text-xs">Required</Label>
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeParticipant(index)}
                      disabled={index === 0 && partyEmail === participant.email}
                    >
                      ×
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addParticipant} className="w-full">
                Add Participant
              </Button>
            </CardContent>
          </Card>

          {/* Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {reminders.map((reminder, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-1 flex items-center">
                    <Checkbox
                      checked={reminder.enabled}
                      onCheckedChange={(checked) => updateReminder(index, 'enabled', checked)}
                    />
                  </div>
                  <div className="col-span-4">
                    <Label>Type</Label>
                    <Select
                      value={reminder.type}
                      onValueChange={(value: 'EMAIL' | 'SMS' | 'PUSH_NOTIFICATION') => 
                        updateReminder(index, 'type', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="SMS">SMS</SelectItem>
                        <SelectItem value="PUSH_NOTIFICATION">Push Notification</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-4">
                    <Label>Minutes Before</Label>
                    <Select
                      value={reminder.minutesBefore.toString()}
                      onValueChange={(value) => updateReminder(index, 'minutesBefore', parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes</SelectItem>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="1440">1 day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReminders(prev => prev.filter((_, i) => i !== index))}
                      disabled={reminders.length === 1}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addReminder} className="w-full">
                Add Reminder
              </Button>
            </CardContent>
          </Card>

          <Button
            onClick={scheduleMeeting}
            disabled={isCreating || participants.some(p => !p.email)}
            className="w-full"
            size="lg"
          >
            {isCreating ? 'Scheduling...' : 'Schedule Meeting with Participants & Reminders'}
          </Button>
        </div>
      )}
    </div>
  );
}