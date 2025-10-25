'use client';

import React from 'react';

interface AreaReviewStepProps {
  form: any;
  config: any;
  actions: any;
  entity?: any;
}

export function AreaReviewStep({ form, config, actions, entity }: AreaReviewStepProps) {
  const cityValue = form.getValues('city');
  const nameValue = form.getValues('name');
  const pincodeValue = form.getValues('pincode');

  // Get city details with hierarchy - handle both object and ID
  let cityDisplay = 'Not selected';
  if (cityValue) {
    if (typeof cityValue === 'object' && cityValue !== null) {
      // It's a CityDTO object
      const parts = [];
      if (cityValue.district?.state?.name) parts.push(cityValue.district.state.name);
      if (cityValue.district?.name) parts.push(cityValue.district.name);
      if (cityValue.name) parts.push(cityValue.name);
      cityDisplay = parts.length > 0 ? parts.join(', ') : 'City selected';
    } else if (typeof cityValue === 'number') {
      // It's just an ID
      cityDisplay = `City ID: ${cityValue}`;
    }
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3 pb-2 border-b border-border/50">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
            ✓
          </div>
          <div>
            <h4 className="font-semibold text-sm text-foreground">Area Information</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review area details before submitting
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* City */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              City
            </div>
            <div className="text-sm font-semibold text-foreground">{cityDisplay}</div>
          </div>

          {/* Area Name */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Area Name
            </div>
            <div className="text-sm font-semibold text-foreground">
              {nameValue || <span className="text-muted-foreground italic">Not set</span>}
            </div>
          </div>

          {/* Pincode */}
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Pincode
            </div>
            <div className="text-sm font-semibold text-foreground">
              {pincodeValue || <span className="text-muted-foreground italic">Not set</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
