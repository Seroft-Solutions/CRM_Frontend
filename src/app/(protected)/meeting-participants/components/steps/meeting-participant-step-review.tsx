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


interface MeetingParticipantStepReviewProps {
  form: UseFormReturn<any>;
}

export function MeetingParticipantStepReview({ form }: MeetingParticipantStepReviewProps) {
  const formValues = form.getValues();


  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Review Meeting Participant</h3>
        <p className="text-muted-foreground">Please review all information before submitting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
            <CardDescription>Core meetingparticipant details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Email
              </span>
              <span className="text-sm font-medium">
                {formValues.email || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Name
              </span>
              <span className="text-sm font-medium">
                {formValues.name || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Response Date Time
              </span>
              <span className="text-sm font-medium">
                {formValues.responseDateTime ? new Date(formValues.responseDateTime).toLocaleString() : null || <span className="text-muted-foreground italic">Not set</span>}
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
                Is Required
              </span>
              <Badge variant={formValues.isRequired ? "default" : "secondary"}>
                {formValues.isRequired ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                Has Accepted
              </span>
              <Badge variant={formValues.hasAccepted ? "default" : "secondary"}>
                {formValues.hasAccepted ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                Has Declined
              </span>
              <Badge variant={formValues.hasDeclined ? "default" : "secondary"}>
                {formValues.hasDeclined ? "Yes" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Classification Relationships */}

        {/* Geographic Relationships */}

        {/* User Relationships */}

        {/* Business Relationships */}

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
                  Meeting
                </span>
                <span className="text-sm font-medium">
                  {formValues.meeting ? 
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
