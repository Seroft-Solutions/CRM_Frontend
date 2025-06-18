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


interface CityStepReviewProps {
  form: UseFormReturn<any>;
}

export function CityStepReview({ form }: CityStepReviewProps) {
  const formValues = form.getValues();


  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Review City</h3>
        <p className="text-muted-foreground">Please review all information before submitting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
            <CardDescription>Core city details</CardDescription>
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
          </CardContent>
        </Card>

        {/* Boolean Settings */}

        {/* Classification Relationships */}

        {/* Geographic Relationships */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Geographic Information</CardTitle>
            <CardDescription>Location and address details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
          </CardContent>
        </Card>

        {/* User Relationships */}

        {/* Business Relationships */}

        {/* Other Relationships */}
      </div>
    </div>
  );
}
