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


interface PartyStepReviewProps {
  form: UseFormReturn<any>;
}

export function PartyStepReview({ form }: PartyStepReviewProps) {
  const formValues = form.getValues();


  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Review Party</h3>
        <p className="text-muted-foreground">Please review all information before submitting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Basic Information</CardTitle>
            <CardDescription>Core party details</CardDescription>
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
                Mobile
              </span>
              <span className="text-sm font-medium">
                {formValues.mobile || <span className="text-muted-foreground italic">Not set</span>}
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
                Whats App
              </span>
              <span className="text-sm font-medium">
                {formValues.whatsApp || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Contact Person
              </span>
              <span className="text-sm font-medium">
                {formValues.contactPerson || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Address1
              </span>
              <span className="text-sm font-medium">
                {formValues.address1 || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Address2
              </span>
              <span className="text-sm font-medium">
                {formValues.address2 || <span className="text-muted-foreground italic">Not set</span>}
              </span>
            </div>
            <div className="flex flex-col space-y-1">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Address3
              </span>
              <span className="text-sm font-medium">
                {formValues.address3 || <span className="text-muted-foreground italic">Not set</span>}
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

        {/* Business Relationships */}

        {/* Other Relationships */}
      </div>
    </div>
  );
}
