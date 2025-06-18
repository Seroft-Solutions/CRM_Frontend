"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";


interface MeetingStepReviewProps {
  form: UseFormReturn<any>;
}

export function MeetingStepReview({ form }: MeetingStepReviewProps) {
  const formValues = form.getValues();


  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Review Meeting</h3>
        <p className="text-muted-foreground">Please review all information before submitting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
            <CardDescription>Core meeting details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Meeting Date Time
              </span>
              <span className="text-sm font-medium">
                {formValues.meetingDateTime ? new Date(formValues.meetingDateTime).toLocaleString() : null || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Duration
              </span>
              <span className="text-sm font-medium">
                {formValues.duration || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Title
              </span>
              <span className="text-sm font-medium">
                {formValues.title || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Description
              </span>
              <span className="text-sm font-medium">
                {formValues.description || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Meeting Url
              </span>
              <span className="text-sm font-medium">
                {formValues.meetingUrl || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Google Calendar Event Id
              </span>
              <span className="text-sm font-medium">
                {formValues.googleCalendarEventId || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Notes
              </span>
              <span className="text-sm font-medium">
                {formValues.notes || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Time Zone
              </span>
              <span className="text-sm font-medium">
                {formValues.timeZone || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Meeting Status
              </span>
              <span className="text-sm font-medium">
                {formValues.meetingStatus || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Meeting Type
              </span>
              <span className="text-sm font-medium">
                {formValues.meetingType || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Created At
              </span>
              <span className="text-sm font-medium">
                {formValues.createdAt ? new Date(formValues.createdAt).toLocaleString() : null || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Updated At
              </span>
              <span className="text-sm font-medium">
                {formValues.updatedAt ? new Date(formValues.updatedAt).toLocaleString() : null || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Boolean Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Settings</CardTitle>
            <CardDescription>Configuration options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                Is Recurring
              </span>
              <Badge variant={formValues.isRecurring ? "default" : "secondary"}>
                {formValues.isRecurring ? "Yes" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Classification Relationships */}

        {/* Geographic Relationships */}

        {/* User Relationships */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Assignments</CardTitle>
            <CardDescription>Assigned users and responsibilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Organizer
              </span>
              <span className="text-sm font-medium">
                {formValues.organizer ? 
                  <Badge variant="outline">User assigned</Badge> : 
                  <span className="text-muted-foreground italic">No user assigned</span>
                }
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Business Relationships */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business Relationships</CardTitle>
            <CardDescription>Partners, customers, and channels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Assigned Party
              </span>
              <span className="text-sm font-medium">
                {formValues.assignedParty ? 
                  <Badge variant="outline">Relationship established</Badge> : 
                  <span className="text-muted-foreground italic">No relationship established</span>
                }
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Other Relationships */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Additional Information</CardTitle>
            <CardDescription>Other related data and references</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Call
                </span>
                <span className="text-sm font-medium">
                  {formValues.call ? 
                    <Badge variant="outline">Selected</Badge> : 
                    <span className="text-muted-foreground italic">Not selected</span>
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
