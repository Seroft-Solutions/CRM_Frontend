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


interface GroupStepReviewProps {
  form: UseFormReturn<any>;
}

export function GroupStepReview({ form }: GroupStepReviewProps) {
  const formValues = form.getValues();


  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Review Group</h3>
        <p className="text-muted-foreground">Please review all information before submitting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
            <CardDescription>Core group details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Keycloak Group Id
              </span>
              <span className="text-sm font-medium">
                {formValues.keycloakGroupId || <span className="text-muted-foreground italic">Not set</span>}
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
                Path
              </span>
              <span className="text-sm font-medium">
                {formValues.path || <span className="text-muted-foreground italic">Not set</span>}
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
          </CardContent>
        </Card>

        {/* Boolean Settings */}

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
                Members
              </span>
              <span className="text-sm font-medium">
                {formValues.members?.length > 0 ? 
                  `${formValues.members.length} user${formValues.members.length !== 1 ? 's' : ''} assigned` : 
                  <span className="text-muted-foreground italic">No users assigned</span>
                }
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Business Relationships */}

        {/* Other Relationships */}
      </div>
    </div>
  );
}
