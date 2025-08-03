// ===============================================================
// 🛑 MANUALLY MODIFIED FILE - SAFE TO EDIT 🛑
// - Enhanced channel step with business partner support
// - This step is now filtered out for business partners in the form provider
// - Channel data is auto-populated in the form provider instead
// - Simplified UI with proper validation handling
// ===============================================================
"use client";

import React, { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { RelationshipRenderer } from "../relationship-renderer";
import { Building2, UserCheck } from "lucide-react";
import { useEntityForm } from "../call-form-provider";

interface CallChannelStepProps {
    form: any;
    config: any;
    actions: any;
}

export function CallChannelStep({ form, config, actions }: CallChannelStepProps) {
    const [callType, setCallType] = useState("");
    const { state, actions: formActions } = useEntityForm();

    // Clear channel fields and errors when switching to organization
    useEffect(() => {
        if (callType === "organization") {
            // Clear channel fields
            form.setValue("channelParties", "");
            form.setValue("channelType", "");
            
            // Clear any validation errors for these fields
            form.clearErrors("channelParties");
            form.clearErrors("channelType");
        }
    }, [callType, form]);

    // Override the validateStep function to handle conditional validation
    useEffect(() => {
        // Store original validateStep function
        const originalValidateStep = formActions.validateStep;
        
        // Create custom validation wrapper
        const customValidateStep = async (stepIndex?: number): Promise<boolean> => {
            const currentStepIndex = stepIndex ?? state.currentStep;
            const currentStepConfig = config.steps[currentStepIndex];
            
            // If this is the channel step, apply custom validation
            if (currentStepConfig?.id === 'channel') {
                // If no call type is selected, require selection
                if (!callType) {
                    return false;
                }
                
                // If organization is selected, bypass channel field validation completely
                if (callType === "organization") {
                    return true;
                }
                
                // If business partner is selected, validate channel type only
                if (callType === "business-partner") {
                    const channelType = form.getValues("channelType");
                    if (!channelType) {
                        form.setError("channelType", {
                            type: "required",
                            message: "Please select channel type for business partner calls"
                        });
                        return false;
                    }
                    return true;
                }
            }
            
            // For other steps, use original validation
            return originalValidateStep(stepIndex);
        };
        
        // Replace the validateStep function
        formActions.validateStep = customValidateStep;
        
        // Cleanup function to restore original validation
        return () => {
            formActions.validateStep = originalValidateStep;
        };
    }, [callType, form, formActions, config, state.currentStep]);

    return (
        <div className="space-y-6">
            {/* Call Type Selection */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Call Type</h3>
                
                <RadioGroup 
                    value={callType} 
                    onValueChange={setCallType}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                    {/* Current Organization */}
                    <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-gray-50">
                        <RadioGroupItem value="organization" id="organization" />
                        <Label htmlFor="organization" className="flex items-center gap-3 cursor-pointer flex-1">
                            <Building2 className="h-5 w-5 text-blue-600" />
                            <div>
                                <div className="font-medium">Current Organization</div>
                                <div className="text-sm text-gray-500">Internal call</div>
                            </div>
                        </Label>
                    </div>

                    {/* Business Partner */}
                    <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-gray-50">
                        <RadioGroupItem value="business-partner" id="business-partner" />
                        <Label htmlFor="business-partner" className="flex items-center gap-3 cursor-pointer flex-1">
                            <UserCheck className="h-5 w-5 text-green-600" />
                            <div>
                                <div className="font-medium">Business Partner</div>
                                <div className="text-sm text-gray-500">External call</div>
                            </div>
                        </Label>
                    </div>
                </RadioGroup>

                {/* Simple status message */}
                {callType === "organization" && (
                    <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
                        ✓ Internal call selected - Ready to continue
                    </div>
                )}
                {callType === "business-partner" && (
                    <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                        ✓ External call selected - Configure channel details below
                    </div>
                )}
            </div>

            {/* Channel Fields - Only show for Business Partner */}
            {callType === "business-partner" && (
                <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Channel Details</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Channel Parties - NOT REQUIRED */}
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
                                        required: false, // NOT REQUIRED
                                        multiple: false,
                                        customFilters: { "channelTypeId.specified": true },
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
                                        ui: { "label": "Channel Parties", "placeholder": "Select channel parties", "icon": "👥" },
                                    }}
                                    field={field}
                                    form={form}
                                    actions={actions}
                                    config={config}
                                />
                            )}
                        />

                        {/* Channel Type - Required only for business partner */}
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
                                        required: false, // We handle validation manually
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
                                        ui: { "label": "Channel Type", "placeholder": "Select channel type", "icon": "📞" },
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
            )}
        </div>
    );
}