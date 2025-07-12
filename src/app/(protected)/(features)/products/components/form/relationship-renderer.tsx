"use client";

import React from "react";
import { FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { PaginatedRelationshipCombobox } from "@/app/(protected)/(features)/products/components/form/paginated-relationship-combobox";

// Import all hooks statically for the specific entity


import type { RelationshipConfig } from "./form-types";

interface RelationshipRendererProps {
  relConfig: RelationshipConfig;
  field: any;
  form: any;
  actions: any;
  config: any;
}

// Generic relationship component that uses hooks based on the relationship name
export function RelationshipRenderer({ 
  relConfig, 
  field, 
  form, 
  actions, 
  config 
}: RelationshipRendererProps) {
  
  // Use hooks based on relationship name - this ensures hooks are called consistently
  const renderRelationshipWithHooks = () => {
    switch (relConfig.name) {
      default:
        // For relationships without proper API configuration, show a fallback message
        return (
          <div className="text-muted-foreground text-sm p-4 border border-dashed rounded">
            Relationship configuration incomplete for: {relConfig.name}
            <br />
            <small>API hooks not defined in form config</small>
          </div>
        );
    }
  };

  return (
    <FormItem>
      <FormLabel className="text-sm font-medium">
        {relConfig.ui.label}
        {relConfig.required && <span className="text-red-500 ml-1">*</span>}
      </FormLabel>
      <FormControl>
        {renderRelationshipWithHooks()}
      </FormControl>
      <FormMessage />
    </FormItem>
  );
}
