'use client';

import { format, addMinutes } from 'date-fns';

export interface CalendarEvent {
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees: Array<{
    email: string;
    displayName?: string;
    responseStatus?: string;
  }>;
  location?: string;
  conferenceData?: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
    };
  };
  reminders: {
    useDefault: boolean;
    overrides?: Array<{
      method: string;
      minutes: number;
    }>;
  };
}

export interface MeetingNotificationData {
  meetingId: string;
  participantEmail: string;
  participantName: string;
  meetingDateTime: string;
  duration: number;
  meetingType: string;
  meetingUrl?: string;
  location?: string;
  organizerName: string;
  organizerEmail: string;
}

class CalendarService {
  private readonly baseApiUrl = '/api';

  /**
   * Create a Google Calendar event
   */
  async createCalendarEvent(
    eventData: CalendarEvent
  ): Promise<{ eventId: string; meetingUrl?: string }> {
    try {
      const response = await fetch(`${this.baseApiUrl}/calendar/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error(`Failed to create calendar event: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        eventId: result.id,
        meetingUrl: result.hangoutLink || result.conferenceData?.entryPoints?.[0]?.uri,
      };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  /**
   * Update a Google Calendar event
   */
  async updateCalendarEvent(eventId: string, eventData: Partial<CalendarEvent>): Promise<void> {
    try {
      const response = await fetch(`${this.baseApiUrl}/calendar/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error(`Failed to update calendar event: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error updating calendar event:', error);
      throw error;
    }
  }

  /**
   * Cancel a Google Calendar event
   */
  async cancelCalendarEvent(eventId: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseApiUrl}/calendar/events/${eventId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel calendar event: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error canceling calendar event:', error);
      throw error;
    }
  }

  /**
   * Get user's available time slots
   */
  async getAvailableTimeSlots(
    userId: number,
    startDate: string,
    endDate: string
  ): Promise<Array<{ start: string; end: string; available: boolean }>> {
    try {
      const response = await fetch(
        `${this.baseApiUrl}/calendar/availability?userId=${userId}&start=${startDate}&end=${endDate}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch availability: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching availability:', error);
      throw error;
    }
  }

  /**
   * Send meeting invitation email
   */
  async sendMeetingInvitation(notificationData: MeetingNotificationData): Promise<void> {
    try {
      const response = await fetch(`${this.baseApiUrl}/notifications/meeting-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
      });

      if (!response.ok) {
        throw new Error(`Failed to send meeting invitation: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending meeting invitation:', error);
      throw error;
    }
  }

  /**
   * Schedule meeting reminders
   */
  async scheduleMeetingReminders(
    meetingId: string,
    reminders: Array<{ type: 'EMAIL' | 'SMS' | 'PUSH_NOTIFICATION'; minutesBefore: number }>
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseApiUrl}/meetings/${meetingId}/reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reminders }),
      });

      if (!response.ok) {
        throw new Error(`Failed to schedule reminders: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error scheduling reminders:', error);
      throw error;
    }
  }

  /**
   * Convert meeting data to Google Calendar event format
   */
  createCalendarEventFromMeeting(
    meetingData: any,
    organizerEmail: string,
    timeZone = 'UTC'
  ): CalendarEvent {
    const startDateTime = new Date(meetingData.meetingDateTime);
    const endDateTime = addMinutes(startDateTime, meetingData.duration);

    const event: CalendarEvent = {
      summary: meetingData.title,
      description: meetingData.description,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone,
      },
      attendees: [
        {
          email: organizerEmail,
          displayName: 'Organizer',
          responseStatus: 'accepted',
        },
        ...meetingData.participants.map((participant: any) => ({
          email: participant.email,
          displayName: participant.name,
          responseStatus: 'needsAction',
        })),
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 120 }, // 2 hours before
          { method: 'popup', minutes: 30 }, // 30 minutes before
        ],
      },
    };

    // Add meeting URL for virtual meetings
    if (meetingData.meetingType === 'VIRTUAL') {
      if (meetingData.meetingUrl) {
        event.location = meetingData.meetingUrl;
      } else {
        // Request Google Meet integration
        event.conferenceData = {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet',
            },
          },
        };
      }
    } else if (meetingData.meetingType === 'IN_PERSON' && meetingData.location) {
      event.location = meetingData.location;
    }

    return event;
  }

  /**
   * Process complete meeting scheduling workflow
   */
  async scheduleCompleteWorkflow(
    meetingData: any,
    organizerEmail: string,
    organizerName: string,
    timeZone = 'UTC'
  ): Promise<{ meetingId: string; googleEventId: string; meetingUrl?: string }> {
    try {
      // 1. Create calendar event
      const calendarEvent = this.createCalendarEventFromMeeting(
        meetingData,
        organizerEmail,
        timeZone
      );
      const { eventId, meetingUrl } = await this.createCalendarEvent(calendarEvent);

      // 2. Create meeting in database (this would be handled by backend API)
      const meetingResponse = await fetch(`${this.baseApiUrl}/meetings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...meetingData,
          googleCalendarEventId: eventId,
          meetingUrl: meetingUrl || meetingData.meetingUrl,
        }),
      });

      if (!meetingResponse.ok) {
        throw new Error('Failed to create meeting in database');
      }

      const meeting = await meetingResponse.json();

      // 3. Send invitation emails
      for (const participant of meetingData.participants) {
        await this.sendMeetingInvitation({
          meetingId: meeting.id,
          participantEmail: participant.email,
          participantName: participant.name,
          meetingDateTime: meetingData.meetingDateTime,
          duration: meetingData.duration,
          meetingType: meetingData.meetingType,
          meetingUrl: meetingUrl || meetingData.meetingUrl,
          location: meetingData.location,
          organizerName,
          organizerEmail,
        });
      }

      // 4. Schedule reminders
      await this.scheduleMeetingReminders(meeting.id, [
        { type: 'EMAIL', minutesBefore: 120 }, // 2 hours before
        { type: 'EMAIL', minutesBefore: 30 }, // 30 minutes before
      ]);

      return {
        meetingId: meeting.id,
        googleEventId: eventId,
        meetingUrl: meetingUrl || meetingData.meetingUrl,
      };
    } catch (error) {
      console.error('Error in complete meeting workflow:', error);
      throw error;
    }
  }
}

export const calendarService = new CalendarService();
export default calendarService;
