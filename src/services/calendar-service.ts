/**
 * FIXED: Calendar Service integrated with actual backend endpoints
 *
 * This service now properly integrates with the existing backend
 * GoogleCalendarService and SchedulerService.
 */

'use client';

import { addMinutes } from 'date-fns';

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

export interface CalendarAuthStatus {
  isAuthenticated: boolean;
  userEmail?: string;
  hasValidToken: boolean;
  tokenExpiry?: number;
  scopes?: string[];
  error?: string;
}

export interface BackendMeetingRequest {
  summary: string;
  location?: string;
  description?: string;
  startTime: string;
  endTime: string;
  timeZone: string;
  attendees: string[];
  userEmail: string;
}

class IntegratedCalendarService {
  private readonly baseApiUrl = '/api';
  private authStatusCache: Map<string, CalendarAuthStatus> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000;

  /**
   * FIXED: Check calendar authentication using backend endpoint
   */
  async checkCalendarAuth(userEmail: string): Promise<CalendarAuthStatus> {
    try {
      const response = await fetch(
        `${this.baseApiUrl}/calendar/oauth2/authorize?userEmail=${encodeURIComponent(userEmail)}`
      );

      if (response.ok) {
        return {
          isAuthenticated: false,
          userEmail,
          hasValidToken: false,
          error: `Calendar authentication required for ${userEmail}`,
        };
      } else {
        const errorData = await response.json();

        if (errorData.includes?.('No credentials found')) {
          return {
            isAuthenticated: false,
            userEmail,
            hasValidToken: false,
            error: `No calendar credentials found for ${userEmail}. Please authorize access.`,
          };
        }

        return {
          isAuthenticated: true,
          userEmail,
          hasValidToken: true,
        };
      }
    } catch (error) {
      console.error('Calendar auth check failed:', error);
      return {
        isAuthenticated: false,
        userEmail,
        hasValidToken: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * FIXED: Get Google Calendar authorization URL using backend
   */
  async getAuthorizationUrl(userEmail: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseApiUrl}/calendar/oauth2/authorize?userEmail=${encodeURIComponent(userEmail)}`
      );

      if (!response.ok) {
        throw new Error(`Failed to get authorization URL: ${response.statusText}`);
      }

      const data = await response.json();
      return data.authUrl;
    } catch (error) {
      console.error('Failed to get authorization URL:', error);
      throw error;
    }
  }

  /**
   * FIXED: Create calendar event using backend GoogleCalendarService
   */
  async createCalendarEvent(
    eventData: CalendarEvent,
    organizerEmail: string
  ): Promise<{ eventId: string; meetingUrl?: string }> {
    try {
      const backendRequest: BackendMeetingRequest = {
        summary: eventData.summary,
        description: eventData.description,
        location: eventData.location,
        startTime: eventData.start.dateTime,
        endTime: eventData.end.dateTime,
        timeZone: eventData.start.timeZone,
        attendees: eventData.attendees.map((a) => a.email),
        userEmail: organizerEmail,
      };

      console.log('Creating calendar event with backend request:', backendRequest);

      const response = await fetch(`${this.baseApiUrl}/calendar/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendRequest),
      });

      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 400 && errorText.includes('No credentials found')) {
          throw new Error(
            `Calendar authentication required for ${organizerEmail}. ` +
              `Please authorize calendar access before scheduling meetings.`
          );
        }

        throw new Error(`Failed to create calendar event: ${errorText}`);
      }

      const responseText = await response.text();

      const eventLink = responseText.replace('Event created successfully: ', '');

      return {
        eventId: 'backend-generated-id',
        meetingUrl: eventLink,
      };
    } catch (error) {
      console.error('Error creating calendar event:', error);
      throw error;
    }
  }

  /**
   * FIXED: Send meeting notification using backend email service
   */
  async sendMeetingInvitation(notificationData: MeetingNotificationData): Promise<void> {
    try {
      const emailRequest = {
        to: notificationData.participantEmail,
        subject: `Meeting Invitation: ${notificationData.meetingDateTime}`,
        message: this.generateMeetingInvitationEmail(notificationData),
      };

      const response = await fetch(`${this.baseApiUrl}/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailRequest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `Failed to send meeting invitation: ${errorData.message || response.statusText}`
        );
      }

      console.log(`Meeting invitation sent to ${notificationData.participantEmail}`);
    } catch (error) {
      console.error('Error sending meeting invitation:', error);
      throw error;
    }
  }

  /**
   * Generate meeting invitation email content
   */
  private generateMeetingInvitationEmail(data: MeetingNotificationData): string {
    return `
Dear ${data.participantName},

You have been invited to a meeting:

Meeting Details:
- Date & Time: ${data.meetingDateTime}
- Duration: ${data.duration} minutes
- Type: ${data.meetingType}
${data.meetingUrl ? `- Meeting URL: ${data.meetingUrl}` : ''}
${data.location ? `- Location: ${data.location}` : ''}

Organizer: ${data.organizerName} (${data.organizerEmail})

Please mark your calendar and be prepared for the meeting.

Best regards,
The Meeting System
    `.trim();
  }

  /**
   * FIXED: Check email service status using backend
   */
  async checkEmailServiceStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseApiUrl}/email/status`);

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('Email service status check failed:', error);
      return false;
    }
  }

  /**
   * Convert meeting data to CalendarEvent format
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
          { method: 'email', minutes: 120 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    if (meetingData.meetingType === 'VIRTUAL') {
      if (meetingData.meetingUrl) {
        event.location = meetingData.meetingUrl;
      } else {
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
   * FIXED: Complete meeting scheduling workflow integrated with backend
   */
  async scheduleCompleteWorkflow(
    meetingData: any,
    organizerEmail: string,
    organizerName: string,
    timeZone = 'UTC'
  ): Promise<{
    meetingId: string;
    googleEventId: string;
    meetingUrl?: string;
    authRequired?: boolean;
  }> {
    try {
      console.log('Starting complete meeting workflow for:', organizerEmail);

      const authStatus = await this.checkCalendarAuth(organizerEmail);

      if (!authStatus.isAuthenticated || !authStatus.hasValidToken) {
        console.warn('Calendar authentication required for:', organizerEmail);
        return {
          meetingId: '',
          googleEventId: '',
          authRequired: true,
        };
      }

      const calendarEvent = this.createCalendarEventFromMeeting(
        meetingData,
        organizerEmail,
        timeZone
      );
      const { eventId, meetingUrl } = await this.createCalendarEvent(calendarEvent, organizerEmail);

      console.log('Calendar event created:', { eventId, meetingUrl });

      const invitationPromises = meetingData.participants.map((participant: any) =>
        this.sendMeetingInvitation({
          meetingId: meetingData.id || 'temp-id',
          participantEmail: participant.email,
          participantName: participant.name,
          meetingDateTime: meetingData.meetingDateTime,
          duration: meetingData.duration,
          meetingType: meetingData.meetingType,
          meetingUrl: meetingUrl || meetingData.meetingUrl,
          location: meetingData.location,
          organizerName,
          organizerEmail,
        })
      );

      await Promise.all(invitationPromises);
      console.log('Meeting invitations sent to all participants');

      console.log(
        'Meeting reminders will be automatically sent by backend scheduler 2 hours before the meeting'
      );

      return {
        meetingId: meetingData.id || 'backend-generated',
        googleEventId: eventId,
        meetingUrl: meetingUrl || meetingData.meetingUrl,
        authRequired: false,
      };
    } catch (error) {
      console.error('Error in complete meeting workflow:', error);

      if (error instanceof Error && error.message.includes('authentication required')) {
        return {
          meetingId: '',
          googleEventId: '',
          authRequired: true,
        };
      }

      throw error;
    }
  }

  /**
   * Clear authentication cache for a user
   */
  clearAuthCache(userEmail: string): void {
    this.authStatusCache.delete(userEmail);
  }

  /**
   * Test all backend integrations
   */
  async testBackendIntegration(): Promise<{
    calendarService: boolean;
    emailService: boolean;
    errors: string[];
  }> {
    const results = {
      calendarService: false,
      emailService: false,
      errors: [] as string[],
    };

    try {
      const authUrl = await this.getAuthorizationUrl('test@example.com');
      results.calendarService = !!authUrl;
    } catch (error: any) {
      results.errors.push(`Calendar service: ${error.message}`);
    }

    try {
      results.emailService = await this.checkEmailServiceStatus();
      if (!results.emailService) {
        results.errors.push('Email service: Service not available');
      }
    } catch (error: any) {
      results.errors.push(`Email service: ${error.message}`);
    }

    return results;
  }
}

export const calendarService = new IntegratedCalendarService();
export default calendarService;
