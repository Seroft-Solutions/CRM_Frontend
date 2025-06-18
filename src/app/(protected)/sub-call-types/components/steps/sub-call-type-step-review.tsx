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


interface SubCallTypeStepReviewProps {
  form: UseFormReturn<any>;
}

export function SubCallTypeStepReview({ form }: SubCallTypeStepReviewProps) {
  const formValues = form.getValues();


  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Review Sub Call Type</h3>
        <p className="text-muted-foreground">Please review all information before submitting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
            <CardDescription>Core subcalltype details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                Description
              </span>
              <span className="text-sm font-medium">
                {formValues.description || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Remark
              </span>
              <span className="text-sm font-medium">
                {formValues.remark || <span className="text-muted-foreground italic">Not set</span>}
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
                Call Type
              </span>
              <span className="text-sm font-medium">
                {formValues.callType ? 
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

        {/* Other Relationships */}
      </div>
    </div>
  );
}
