// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
'use client';

import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RelationshipRenderer } from '../relationship-renderer';
import { formatLeadNoForDisplay } from '../../../utils/leadNo-generator';

interface CallClassificationStepProps {
  form: any;
  config: any;
  actions: any;
  entity?: any;
}

export function CallClassificationStep({
  form,
  config,
  actions,
  entity,
}: CallClassificationStepProps) {
  const leadNoValue = form.watch('leadNo');

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Lead Number Field - Always first */}
        <div className="md:col-span-2 xl:col-span-3">
          <FormField
            control={form.control}
            name="leadNo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  🏷️ Lead Number
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      value={field.value || ''}
                      readOnly
                      className="font-mono text-sm bg-gray-50 border-dashed"
                      placeholder="Auto-generated lead number"
                    />

                  </div>
                </FormControl>

              </FormItem>
            )}
          />
        </div>

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
                ui: { label: 'Priority', placeholder: 'Select priority', icon: '🏷️' },
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
                  createPermission: 'callType:create:inline',
                },
                ui: { label: 'Call Type', placeholder: 'Select call type', icon: '🏷️' },
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
                cascadingFilter: { parentField: 'callType', filterField: 'callType' },
                api: {
                  useGetAllHook: 'useGetAllSubCallTypes',
                  useSearchHook: 'useSearchSubCallTypes',
                  useCountHook: 'useCountSubCallTypes',
                  entityName: 'SubCallTypes',
                },
                creation: {
                  canCreate: true,
                  createPath: '/sub-call-types/new',
                  createPermission: 'subCallType:create:inline',
                },
                ui: { label: 'Sub Call Type', placeholder: 'Select sub call type', icon: '🏷️' },
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
                  createPermission: 'callStatus:create:inline',
                },
                ui: { label: 'Call Status', placeholder: 'Select call status', icon: '🏷️' },
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
