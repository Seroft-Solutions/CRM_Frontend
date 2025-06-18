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


interface UserProfileStepReviewProps {
  form: UseFormReturn<any>;
}

export function UserProfileStepReview({ form }: UserProfileStepReviewProps) {
  const formValues = form.getValues();


  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Review User Profile</h3>
        <p className="text-muted-foreground">Please review all information before submitting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
            <CardDescription>Core userprofile details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Keycloak Id
              </span>
              <span className="text-sm font-medium">
                {formValues.keycloakId || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
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
                First Name
              </span>
              <span className="text-sm font-medium">
                {formValues.firstName || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Last Name
              </span>
              <span className="text-sm font-medium">
                {formValues.lastName || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Boolean Settings */}

        {/* Classification Relationships */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Classification</CardTitle>
            <CardDescription>Category and status information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Channel Type
              </span>
              <span className="text-sm font-medium">
                {formValues.channelType ? 
                  <Badge variant="outline">Selected</Badge> : 
                  <span className="text-muted-foreground italic">Not selected</span>
                }
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Geographic Relationships */}

        {/* User Relationships */}

        {/* Business Relationships */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business Relationships</CardTitle>
            <CardDescription>Partners, customers, and channels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Channel Type
              </span>
              <span className="text-sm font-medium">
                {formValues.channelType ? 
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
                  Organization
                </span>
                <span className="text-sm font-medium">
                  {formValues.organization?.length > 0 ? 
                    `${formValues.organization.length} item${formValues.organization.length !== 1 ? 's' : ''} selected` : 
                    <span className="text-muted-foreground italic">None selected</span>
                  }
                </span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Groups
                </span>
                <span className="text-sm font-medium">
                  {formValues.groups?.length > 0 ? 
                    `${formValues.groups.length} item${formValues.groups.length !== 1 ? 's' : ''} selected` : 
                    <span className="text-muted-foreground italic">None selected</span>
                  }
                </span>
              </div>
              <div className="flex flex-col space-y-1">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Roles
                </span>
                <span className="text-sm font-medium">
                  {formValues.roles?.length > 0 ? 
                    `${formValues.roles.length} item${formValues.roles.length !== 1 ? 's' : ''} selected` : 
                    <span className="text-muted-foreground italic">None selected</span>
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
