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


interface CallStepReviewProps {
  form: UseFormReturn<any>;
}

export function CallStepReview({ form }: CallStepReviewProps) {
  const formValues = form.getValues();


  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Review Call</h3>
        <p className="text-muted-foreground">Please review all information before submitting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
            <CardDescription>Core call details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Call Date Time
              </span>
              <span className="text-sm font-medium">
                {formValues.callDateTime ? new Date(formValues.callDateTime).toLocaleString() : null || <span className="text-muted-foreground italic">Not set</span>}
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
                Priority
              </span>
              <span className="text-sm font-medium">
                {formValues.priority ? 
                  <Badge variant="outline">Selected</Badge> : 
                  <span className="text-muted-foreground italic">Not selected</span>
                }
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Call Type
              </span>
              <span className="text-sm font-medium">
                {formValues.callType ? 
                  <Badge variant="outline">Selected</Badge> : 
                  <span className="text-muted-foreground italic">Not selected</span>
                }
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sub Call Type
              </span>
              <span className="text-sm font-medium">
                {formValues.subCallType ? 
                  <Badge variant="outline">Selected</Badge> : 
                  <span className="text-muted-foreground italic">Not selected</span>
                }
              </span>
            </div>
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
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Call Category
              </span>
              <span className="text-sm font-medium">
                {formValues.callCategory ? 
                  <Badge variant="outline">Selected</Badge> : 
                  <span className="text-muted-foreground italic">Not selected</span>
                }
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Call Status
              </span>
              <span className="text-sm font-medium">
                {formValues.callStatus ? 
                  <Badge variant="outline">Selected</Badge> : 
                  <span className="text-muted-foreground italic">Not selected</span>
                }
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Geographic Relationships */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Geographic Information</CardTitle>
            <CardDescription>Location and address details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                State
              </span>
              <span className="text-sm font-medium">
                {formValues.state ? 
                  <Badge variant="outline">Selected</Badge> : 
                  <span className="text-muted-foreground italic">Not selected</span>
                }
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                District
              </span>
              <span className="text-sm font-medium">
                {formValues.district ? 
                  <Badge variant="outline">Selected</Badge> : 
                  <span className="text-muted-foreground italic">Not selected</span>
                }
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                City
              </span>
              <span className="text-sm font-medium">
                {formValues.city ? 
                  <Badge variant="outline">Selected</Badge> : 
                  <span className="text-muted-foreground italic">Not selected</span>
                }
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Area
              </span>
              <span className="text-sm font-medium">
                {formValues.area ? 
                  <Badge variant="outline">Selected</Badge> : 
                  <span className="text-muted-foreground italic">Not selected</span>
                }
              </span>
            </div>
          </CardContent>
        </Card>

        {/* User Relationships */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Assignments</CardTitle>
            <CardDescription>Assigned users and responsibilities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Assigned To
              </span>
              <span className="text-sm font-medium">
                {formValues.assignedTo ? 
                  <Badge variant="outline">User assigned</Badge> : 
                  <span className="text-muted-foreground italic">No user assigned</span>
                }
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Channel Party
              </span>
              <span className="text-sm font-medium">
                {formValues.channelParty ? 
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
                Channel Type
              </span>
              <span className="text-sm font-medium">
                {formValues.channelType ? 
                  <Badge variant="outline">Relationship established</Badge> : 
                  <span className="text-muted-foreground italic">No relationship established</span>
                }
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Channel Party
              </span>
              <span className="text-sm font-medium">
                {formValues.channelParty ? 
                  <Badge variant="outline">Relationship established</Badge> : 
                  <span className="text-muted-foreground italic">No relationship established</span>
                }
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Party
              </span>
              <span className="text-sm font-medium">
                {formValues.party ? 
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
                  Source
                </span>
                <span className="text-sm font-medium">
                  {formValues.source ? 
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
