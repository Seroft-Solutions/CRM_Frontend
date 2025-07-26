// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
"use client";

import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RelationshipRenderer } from "../relationship-renderer";

interface CallClassificationStepProps {
  form: any;
  config: any;
  actions: any;
}

export function CallClassificationStep({ form, config, actions }: CallClassificationStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Generated Form Fields */}
        
        {/* Generated Relationship Fields */}
        
        {/* Priority Relationship */}
        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <RelationshipRenderer
              relConfig={{
                name: 'priority',
                type: 'many-to-one',
                targetEntity: 'priority',
                displayField: 'name',
                primaryKey: 'id',
                required: true,
                multiple: false,
                api: {
                  useGetAllHook: 'useGetAllPriorities',
                  useSearchHook: 'useSearchPriorities',
                  useCountHook: 'useCountPriorities',
                  entityName: 'Priorities',
                },
                creation: {
                  canCreate: true,
                  createPath: '/priorities/new',
                  createPermission: 'priority:create:inline',
                },
                ui: {
                  label: 'Priority',
                  placeholder: 'Select priority',
                  icon: '🔗',
                }
              }}
              field={field}
              form={form}
              actions={actions}
              config={config}
            />
          )}
        />
        
        {/* Call Type Relationship */}
        <FormField
          control={form.control}
          name="callType"
          render={({ field }) => (
            <RelationshipRenderer
              relConfig={{
                name: 'callType',
                type: 'many-to-one',
                targetEntity: 'callType',
                displayField: 'name',
                primaryKey: 'id',
                required: true,
                multiple: false,
                api: {
                  useGetAllHook: 'useGetAllCallTypes',
                  useSearchHook: 'useSearchCallTypes',
                  useCountHook: 'useCountCallTypes',
                  entityName: 'CallTypes',
                },
                creation: {
                  canCreate: true,
                  createPath: '/call-types/new',
                  createPermission: 'call-type:create:inline',
                },
                ui: {
                  label: 'Call Type',
                  placeholder: 'Select call type',
                  icon: '🔗',
                }
              }}
              field={field}
              form={form}
              actions={actions}
              config={config}
            />
          )}
        />
        
        {/* Sub Call Type Relationship */}
        <FormField
          control={form.control}
          name="subCallType"
          render={({ field }) => (
            <RelationshipRenderer
              relConfig={{
                name: 'subCallType',
                type: 'many-to-one',
                targetEntity: 'subCallType',
                displayField: 'name',
                primaryKey: 'id',
                required: true,
                multiple: false,
                api: {
                  useGetAllHook: 'useGetAllSubCallTypes',
                  useSearchHook: 'useSearchSubCallTypes',
                  useCountHook: 'useCountSubCallTypes',
                  entityName: 'SubCallTypes',
                },
                creation: {
                  canCreate: true,
                  createPath: '/sub-call-types/new',
                  createPermission: 'sub-call-type:create:inline',
                },
                ui: {
                  label: 'Sub Call Type',
                  placeholder: 'Select sub call type',
                  icon: '🔗',
                }
              }}
              field={field}
              form={form}
              actions={actions}
              config={config}
            />
          )}
        />
        
        {/* Call Status Relationship */}
        <FormField
          control={form.control}
          name="callStatus"
          render={({ field }) => (
            <RelationshipRenderer
              relConfig={{
                name: 'callStatus',
                type: 'many-to-one',
                targetEntity: 'callStatus',
                displayField: 'name',
                primaryKey: 'id',
                required: true,
                multiple: false,
                api: {
                  useGetAllHook: 'useGetAllCallStatuses',
                  useSearchHook: 'useSearchCallStatuses',
                  useCountHook: 'useCountCallStatuses',
                  entityName: 'CallStatuses',
                },
                creation: {
                  canCreate: true,
                  createPath: '/call-statuses/new',
                  createPermission: 'call-status:create:inline',
                },
                ui: {
                  label: 'Call Status',
                  placeholder: 'Select call status',
                  icon: '🔗',
                }
              }}
              field={field}
              form={form}
              actions={actions}
              config={config}
            />
          )}
        />
      </div>
    </div>
  );
}
