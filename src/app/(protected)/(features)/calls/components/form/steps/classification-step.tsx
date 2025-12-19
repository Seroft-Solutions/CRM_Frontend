'use client';

import React, { useEffect } from 'react';
import { FormField } from '@/components/ui/form';
import { RelationshipRenderer } from '../relationship-renderer';
import { EnhancedUserProfileRelationshipField } from '@/app/(protected)/(features)/user-profiles/components/enhanced-user-profile-relationship-field';
import { getAllCallStatuses, getAllPriorities } from '@/core/api/generated/spring';
import { useUserAuthorities } from '@/core/auth';

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
  const { hasGroup } = useUserAuthorities();

  const isBusinessPartner = hasGroup('Business Partners');

  // Filters for assigned to field
  const assignedToFilters = {
    'channelTypeId.specified': false,
    'email.notEquals': 'admin@gmail.com',
  };

  useEffect(() => {
    const setDefaultCallStatus = async () => {
      try {
        const callStatuses = await getAllCallStatuses();
        const newStatus = callStatuses.find((status: any) => status.name === 'New');
        if (newStatus && !form.getValues('callStatus')) {
          form.setValue('callStatus', newStatus.id);
        }
      } catch (error) {
        console.error('Failed to fetch call statuses:', error);
      }
    };
    setDefaultCallStatus();
  }, [form]);

  useEffect(() => {
    const setDefaultPriority = async () => {
      try {
        const priorities = await getAllPriorities();
        const mediumPriority = priorities.find((priority: any) => priority.name === 'Medium');
        if (mediumPriority && !form.getValues('priority')) {
          form.setValue('priority', mediumPriority.id);
        }
      } catch (error) {
        console.error('Failed to fetch priorities:', error);
      }
    };
    setDefaultPriority();
  }, [form]);

  return (
    <>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
                  required: false,
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

          {/* Assigned To Relationship */}
          {!isBusinessPartner && (
            <FormField
              control={form.control}
              name="assignedTo"
              render={({ field }) => (
                <div>
                  <label className="text-sm font-medium">Assigned To</label>
                  <EnhancedUserProfileRelationshipField
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Select assigned to"
                    customFilters={assignedToFilters}
                  />
                </div>
              )}
            />
          )}
        </div>
      </div>
    </>
  );
}
