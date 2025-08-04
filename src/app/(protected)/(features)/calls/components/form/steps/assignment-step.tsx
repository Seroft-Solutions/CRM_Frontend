// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
"use client";

import React from "react";
import {FormField, FormItem, FormLabel, FormControl, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {RelationshipRenderer} from "@/app/(protected)/(features)/calls/components/form/relationship-renderer";

interface CallAssignmentStepProps {
    form: any;
    config: any;
    actions: any;
}

export function CallAssignmentStep({form, config, actions}: CallAssignmentStepProps) {
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {/* Generated Form Fields */}

                {/* Generated Relationship Fields */}

                {/* Assigned To Relationship */}
                <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({field}) => (
                        <RelationshipRenderer
                            relConfig={{
                                name: 'assignedTo',
                                type: 'many-to-one',
                                targetEntity: 'userProfile',
                                displayField: 'displayName',
                                primaryKey: 'id',
                                required: false,
                                multiple: false,
                                customFilters: {"channelTypeId.specified": false},
                                api: {
                                    "useGetAllHook": "useGetAllUserProfiles",
                                    "useSearchHook": "useSearchUserProfiles",
                                    "useCountHook": "useCountUserProfiles",
                                    "entityName": "UserProfiles"
                                },
                                creation: {
                                    "canCreate": true,
                                    "createPath": "/user-profiles/new",
                                    "createPermission": "userProfile:create:inline"
                                },
                                ui: {"label": "Assigned To", "placeholder": "Select assigned to", "icon": "👤"},
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
