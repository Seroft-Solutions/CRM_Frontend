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
import Calendar20 from "@/components/calendar-20";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { 
  CalendarDays, 
  Video, 
  Phone, 
  MapPin, 
  Users, 
  Bell, 
  Clock,
  CheckCircle2,
  ChevronRight,
  Settings,
  Sparkles,
  ArrowRight,
  Plus,
  X
} from "lucide-react";
import { format, addMinutes } from "date-fns";
import { cn } from "@/lib/utils";
import './meeting-scheduler.css';

// Backend imports
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
import {useGetCustomer} from "@/core/api/generated/spring";

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
  assignedUserId?: number;
  callId?: number;
  onMeetingScheduledAction: (meetingData: any) => void;
  disabled?: boolean;
}

type Step = 'datetime' | 'details' | 'participants' | 'confirmation';

export function MeetingScheduler({
  customerId,
  assignedUserId,
  callId,
  onMeetingScheduledAction,
  disabled = false
}: MeetingSchedulerProps) {
  const [currentStep, setCurrentStep] = useState<Step>('datetime');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [meetingDetails, setMeetingDetails] = useState<MeetingDetails>({
    title: '',
    description: '',
    duration: 30,
    meetingType: 'VIRTUAL',
    meetingUrl: 'https://meet.google.com/',
    location: ''
  });
  const [participants, setParticipants] = useState<ParticipantDetails[]>([]);
  const [reminders, setReminders] = useState<ReminderDetails[]>([
    { enabled: true, type: 'EMAIL', minutesBefore: 15 }
  ]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [bookedDates, setBookedDates] = useState<Date[]>([]);

  const { data: customerData } = useGetCustomer(customerId || 0, {
    query: { enabled: !!customerId }
  });

  // Backend hooks
  const { mutate: createMeeting, isPending: isCreating } = useCreateMeeting({
    mutation: {
      onSuccess: async (meetingData) => {
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

        const enabledReminders = reminders.filter(r => r.enabled);
        if (enabledReminders.length > 0) {
          await Promise.all(
            enabledReminders.map(reminder =>
              createMeetingReminder({
                data: {
                  reminderType: reminder.type as keyof typeof MeetingReminderDTOReminderType,
                  reminderMinutesBefore: reminder.minutesBefore,
                  meeting: meetingData
                }
              })
            )
          );
        }

        onMeetingScheduledAction(meetingData);
      },
      onError: (error) => {
        console.error('Failed to create meeting:', error);
      },
    },
  });

  const { mutate: createMeetingParticipant } = useCreateMeetingParticipant();
  const { mutate: createMeetingReminder } = useCreateMeetingReminder();

  // Get data from backend
  const { data: timeSlots } = useGetAllAvailableTimeSlots(
    assignedUserId ? { 'userId.equals': assignedUserId, 'isBooked.equals': false } : undefined,
    { query: { enabled: !!assignedUserId } }
  );

  const { data: userAvailabilities } = useGetAllUserAvailabilities(
    assignedUserId ? { 'userId.equals': assignedUserId } : undefined,
    { query: { enabled: !!assignedUserId } }
  );

  const { data: existingMeetings } = useGetAllMeetings(
    assignedUserId ? { 'organizerId.equals': assignedUserId } : undefined,
    { query: { enabled: !!assignedUserId } }
  );

  // Initialize default participant
  useEffect(() => {
    if (customerData && participants.length === 0) {
      setParticipants([{
        email: customerData.email || '',
        name: customerData.customerBusinessName || '',
        isRequired: true
      }]);
    }

    if (customerData && !meetingDetails.title) {
      setMeetingDetails(prev => ({
        ...prev,
        title: `Follow-up Meeting with ${customerData.customerBusinessName || 'Customer'}`
      }));
    }
  }, [customerData, participants.length, meetingDetails.title]);

  // Process available time slots
  useEffect(() => {
    const slots: string[] = [];
    
    if (timeSlots && userAvailabilities) {
      timeSlots.forEach(slot => {
        if (!slot.isBooked) {
          const slotTime = new Date(slot.slotDateTime);
          const timeString = format(slotTime, 'HH:mm');
          if (!slots.includes(timeString)) {
            slots.push(timeString);
          }
        }
      });

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
    }
    
    // Default time slots if none from backend
    if (slots.length === 0) {
      for (let hour = 9; hour <= 17; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          if (hour === 17 && minute > 0) break;
          const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          slots.push(timeSlot);
        }
      }
    }
    
    setAvailableTimeSlots(slots.sort());
  }, [timeSlots, userAvailabilities]);

  // Process booked dates
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
      meetingType: meetingDetails.meetingType as keyof typeof MeetingDTOMeetingType,
      meetingUrl: meetingDetails.meetingUrl,
      notes: '',
      isRecurring: false,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      meetingStatus: MeetingDTOMeetingStatus.SCHEDULED,
      organizer: { id: assignedUserId } as any,
      assignedCustomer: customerId ? ({ id: customerId } as any) : undefined,
      call: { id: callId } as any,
    };

    createMeeting({ data: meetingData });
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 'datetime':
        return selectedDate && selectedTime;
      case 'details':
        return meetingDetails.title.trim().length > 0;
      case 'participants':
        return participants.every(p => p.email && p.name);
      default:
        return true;
    }
  };

  const getStepProgress = () => {
    const steps = ['datetime', 'details', 'participants', 'confirmation'];
    return ((steps.indexOf(currentStep) + 1) / steps.length) * 100;
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
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Step {['datetime', 'details', 'participants', 'confirmation'].indexOf(currentStep) + 1} of 4</span>
          </div>
          <div className="text-sm text-gray-500">
            {currentStep === 'datetime' && 'Select Date & Time'}
            {currentStep === 'details' && 'Meeting Details'}
            {currentStep === 'participants' && 'Add Participants'}
            {currentStep === 'confirmation' && 'Review & Schedule'}
          </div>
        </div>
        <Progress value={getStepProgress()} className="h-2" />
      </div>

      {/* Step Content */}
      {currentStep === 'datetime' && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="p-2 bg-blue-600 rounded-lg">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
              Select Date & Time
            </CardTitle>
            <p className="text-gray-600 mt-2">Choose when you'd like to meet with {customerData?.customerBusinessName}</p>
          </CardHeader>
          <CardContent className="p-8 flex justify-center">
            <div className="max-w-2xl w-full">
              <Calendar20
                onDateTimeSelected={(date: Date, time: string) => {
                  setSelectedDate(date);
                  setSelectedTime(time);
                }}
                bookedDates={bookedDates}
                availableTimeSlots={availableTimeSlots}
                initialDate={selectedDate}
                initialTime={selectedTime}
                showContinueButton={false}
                disabled={false}
              />
            </div>
          </CardContent>
          <CardFooter className="bg-gray-50 px-8 py-6">
            <Button 
              onClick={() => setCurrentStep('details')}
              disabled={!canProceedToNext()}
              className="ml-auto h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm"
              size="lg"
            >
              Next: Meeting Details
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {currentStep === 'details' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Meeting Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter meeting title"
                  value={meetingDetails.title}
                  onChange={(e) => setMeetingDetails(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
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
                <Label htmlFor="meetingUrl">Meeting URL</Label>
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
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add meeting agenda or notes..."
                value={meetingDetails.description}
                onChange={(e) => setMeetingDetails(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('datetime')}>
              Back
            </Button>
            <Button 
              onClick={() => setCurrentStep('participants')}
              disabled={!canProceedToNext()}
            >
              Next: Participants
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {currentStep === 'participants' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Participants & Reminders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Participants */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Meeting Participants</h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setParticipants(prev => [...prev, { email: '', name: '', isRequired: false }])}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Participant
                </Button>
              </div>
              
              <div className="space-y-3">
                {participants.map((participant, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end p-3 border rounded-lg">
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
                        onClick={() => setParticipants(prev => prev.filter((_, i) => i !== index))}
                        disabled={index === 0 && customerData?.email === participant.email}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reminders */}
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Email Reminders
                </h4>
              </div>
              
              <div className="space-y-3">
                {reminders.map((reminder, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Checkbox
                        checked={reminder.enabled}
                        onCheckedChange={(checked) => {
                          const newReminders = [...reminders];
                          newReminders[index].enabled = checked as boolean;
                          setReminders(newReminders);
                        }}
                      />
                      <span className="text-sm">Send email reminder</span>
                    </div>
                    <Select
                      value={reminder.minutesBefore.toString()}
                      onValueChange={(value) => {
                        const newReminders = [...reminders];
                        newReminders[index].minutesBefore = parseInt(value);
                        setReminders(newReminders);
                      }}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 minutes before</SelectItem>
                        <SelectItem value="15">15 minutes before</SelectItem>
                        <SelectItem value="30">30 minutes before</SelectItem>
                        <SelectItem value="60">1 hour before</SelectItem>
                        <SelectItem value="1440">1 day before</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('details')}>
              Back
            </Button>
            <Button 
              onClick={() => setCurrentStep('confirmation')}
              disabled={!canProceedToNext()}
            >
              Review Meeting
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </CardFooter>
        </Card>
      )}

      {currentStep === 'confirmation' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Review & Schedule Meeting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Meeting Summary */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg">{meetingDetails.title}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-blue-600" />
                  <span>{selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{selectedTime && format(new Date(`2000-01-01 ${selectedTime}`), 'h:mm a')} ({meetingDetails.duration} min)</span>
                </div>
                <div className="flex items-center gap-2">
                  {meetingDetails.meetingType === 'VIRTUAL' && <Video className="w-4 h-4 text-blue-600" />}
                  {meetingDetails.meetingType === 'PHONE_CALL' && <Phone className="w-4 h-4 text-blue-600" />}
                  {meetingDetails.meetingType === 'IN_PERSON' && <MapPin className="w-4 h-4 text-blue-600" />}
                  <span>
                    {meetingDetails.meetingType === 'VIRTUAL' && 'Virtual Meeting'}
                    {meetingDetails.meetingType === 'PHONE_CALL' && 'Phone Call'}
                    {meetingDetails.meetingType === 'IN_PERSON' && meetingDetails.location}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {meetingDetails.description && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Description:</h4>
                  <p className="text-sm text-gray-600">{meetingDetails.description}</p>
                </div>
              )}
            </div>

            {/* Participants List */}
            <div>
              <h4 className="font-medium mb-3">Participants will be notified:</h4>
              <div className="space-y-2">
                {participants.map((participant, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="font-medium">{participant.name}</span>
                    <span className="text-gray-500">({participant.email})</span>
                    {participant.isRequired && (
                      <Badge variant="secondary" className="text-xs">Required</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Reminders */}
            {reminders.some(r => r.enabled) && (
              <div>
                <h4 className="font-medium mb-3">Email reminders:</h4>
                <div className="space-y-2">
                  {reminders.filter(r => r.enabled).map((reminder, index) => (
                    <div key={index} className="flex items-center gap-3 text-sm">
                      <Bell className="w-4 h-4 text-blue-600" />
                      <span>
                        {reminder.minutesBefore < 60 
                          ? `${reminder.minutesBefore} minutes before`
                          : reminder.minutesBefore === 60
                          ? '1 hour before'
                          : '1 day before'
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep('participants')}>
              Back
            </Button>
            <Button 
              onClick={scheduleMeeting}
              disabled={isCreating}
              className="bg-green-600 hover:bg-green-700"
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
      )}
    </div>
  );
}