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


interface CallRemarkStepReviewProps {
  form: UseFormReturn<any>;
}

export function CallRemarkStepReview({ form }: CallRemarkStepReviewProps) {
  const formValues = form.getValues();


  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Review Call Remark</h3>
        <p className="text-muted-foreground">Please review all information before submitting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
            <CardDescription>Core callremark details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Remark
              </span>
              <span className="text-sm font-medium">
                {formValues.remark || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Date Time
              </span>
              <span className="text-sm font-medium">
                {formValues.dateTime ? new Date(formValues.dateTime).toLocaleString() : null || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Boolean Settings */}

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
