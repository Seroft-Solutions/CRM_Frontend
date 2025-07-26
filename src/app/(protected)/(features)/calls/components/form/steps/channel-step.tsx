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

interface CallChannelStepProps {
  form: any;
  config: any;
  actions: any;
}

export function CallChannelStep({ form, config, actions }: CallChannelStepProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Generated Form Fields */}
        
        {/* Generated Relationship Fields */}
        
        {/* Channel Type Relationship */}
        <FormField
          control={form.control}
          name="channelType"
          render={({ field }) => (
            <RelationshipRenderer
              relConfig={{
                name: 'channelType',
                type: 'many-to-one',
                targetEntity: 'channelType',
                displayField: 'name',
                primaryKey: 'id',
                required: true,
                multiple: false,
                api: {
                  useGetAllHook: 'useGetAllChannelTypes',
                  useSearchHook: 'useSearchChannelTypes',
                  useCountHook: 'useCountChannelTypes',
                  entityName: 'ChannelTypes',
                },
                creation: {
                  canCreate: true,
                  createPath: '/channel-types/new',
                  createPermission: 'channel-type:create:inline',
                },
                ui: {
                  label: 'Channel Type',
                  placeholder: 'Select channel type',
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
        
        {/* Channel Parties Relationship */}
        <FormField
          control={form.control}
          name="channelParties"
          render={({ field }) => (
            <RelationshipRenderer
              relConfig={{
                name: 'channelParties',
                type: 'many-to-one',
                targetEntity: 'userProfile',
                displayField: 'displayName',
                primaryKey: 'id',
                required: false,
                multiple: false,
                api: {
                  useGetAllHook: 'useGetAllUserProfiles',
                  useSearchHook: 'useSearchUserProfiles',
                  useCountHook: 'useCountUserProfiles',
                  entityName: 'UserProfiles',
                },
                creation: {
                  canCreate: true,
                  createPath: '/user-profiles/new',
                  createPermission: 'user-profile:create:inline',
                },
                ui: {
                  label: 'Channel Parties',
                  placeholder: 'Select channel parties',
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
