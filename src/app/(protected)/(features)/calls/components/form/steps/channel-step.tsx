// ===============================================================
// 🛑 MANUALLY MODIFIED FILE - SAFE TO EDIT 🛑
// - Enhanced channel step with business partner support
// - This step is now filtered out for business partners in the form provider
// - Channel data is auto-populated in the form provider instead
// ===============================================================
"use client";

import React from "react";
import {FormField, FormItem, FormLabel, FormControl, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {RelationshipRenderer} from "../relationship-renderer";

interface CallChannelStepProps {
    form: any;
    config: any;
    actions: any;
}

export function CallChannelStep({form, config, actions}: CallChannelStepProps) {
    // Note: This step is completely filtered out for business partners 
    // in the form provider, so it won't render at all for them.

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {/* Generated Form Fields */}

                {/* Generated Relationship Fields */}

                {/* Channel Parties Relationship */}
                <FormField
                    control={form.control}
                    name="channelParties"
                    render={({field}) => (
                        <RelationshipRenderer
                            relConfig={{
                                name: 'channelParties',
                                type: 'many-to-one',
                                targetEntity: 'userProfile',
                                displayField: 'displayName',
                                primaryKey: 'id',
                                required: false,
                                multiple: false,
                                customFilters: {"channelTypeId.specified": true},
                                api: {
                                    "useGetAllHook": "useGetAllUserProfiles",
                                    "useSearchHook": "useSearchUserProfiles",
                                    "useCountHook": "useCountUserProfiles",
                                    "entityName": "UserProfiles"
                                },
                                creation: {
                                    "canCreate": true,
                                    "createPath": "/invite-partners",
                                    "createPermission": "invite-partners:create:inline"
                                },
                                ui: {"label": "Channel Parties", "placeholder": "Select channel parties", "icon": "📞"},
                            }}
                            field={field}
                            form={form}
                            actions={actions}
                            config={config}
                        />
                    )}
                />

                {/* Channel Type Relationship */}
                <FormField
                    control={form.control}
                    name="channelType"
                    render={({field}) => (
                        <RelationshipRenderer
                            relConfig={{
                                name: 'channelType',
                                type: 'many-to-one',
                                targetEntity: 'channelType',
                                displayField: 'name',
                                primaryKey: 'id',
                                required: true,
                                multiple: false,
                                autoPopulate: {
                                    "sourceField": "channelParties",
                                    "targetField": "channelType",
                                    "sourceProperty": "channelType",
                                    "allowOverride": true
                                },
                                api: {
                                    "useGetAllHook": "useGetAllChannelTypes",
                                    "useSearchHook": "useSearchChannelTypes",
                                    "useCountHook": "useCountChannelTypes",
                                    "entityName": "ChannelTypes"
                                },
                                creation: {
                                    "canCreate": true,
                                    "createPath": "/channel-types/new",
                                    "createPermission": "channelType:create:inline"
                                },
                                ui: {"label": "Channel Type", "placeholder": "Select channel type", "icon": "📞"},
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
