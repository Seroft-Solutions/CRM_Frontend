// ===============================================================
// 🛑 MANUALLY MODIFIED FILE - SAFE TO EDIT 🛑
// - Enhanced business step with integrated call remarks functionality
// - Allows adding remarks that are saved when call is created
// - Added business partner filtering for customers by createdBy
// ===============================================================
'use client';

import React, {useEffect, useMemo, useState} from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RelationshipRenderer } from '../relationship-renderer';
import { EnhancedCustomerRelationshipField } from '@/app/(protected)/(features)/customers/components/enhanced-customer-relationship-field';
import { EnhancedProductRelationshipField } from '@/app/(protected)/(features)/products/components/enhanced-product-relationship-field';
import { useUserAuthorities } from '@/core/auth';
import { useAccount } from '@/core/auth';
import {useEntityForm} from "@/app/(protected)/(features)/calls/components/form/call-form-provider";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group";
import {Label} from "@/components/ui/label";
import {Building2, UserCheck} from "lucide-react";
import {Textarea} from "@/components/ui/textarea";
import {CallRemark} from "@/app/(protected)/(features)/calls/hooks/use-call-remarks";

interface CallBusinessStepProps {
  form: any;
  config: any;
  actions: any;
  entity?: any;
}

export function CallBusinessStep({ form, config, actions, entity }: CallBusinessStepProps) {
  const { hasGroup } = useUserAuthorities();
  const { data: accountData } = useAccount();
  const isBusinessPartner = hasGroup('Business Partners');
    const [callType, setCallType] = useState('');
    const { state, actions: formActions } = useEntityForm();
    const [remarkText, setRemarkText] = useState('');

    // Initialize remark from form state on mount
    useEffect(() => {
        const existingRemarks = form.getValues('tempRemarks') || [];
        if (existingRemarks.length > 0) {
            setRemarkText(existingRemarks[0].remark);
        }
    }, [form]);

    const saveRemark = () => {
        const trimmedRemark = remarkText.trim();
        if (!trimmedRemark) {
            form.setValue('tempRemarks', [], {shouldDirty: true});
            return;
        }

        const existingRemarks = form.getValues('tempRemarks') || [];
        const newRemarkObj: CallRemark = {
            id: existingRemarks.length > 0 ? existingRemarks[0].id : Date.now().toString(),
            remark: trimmedRemark,
            dateTime: new Date(),
        };

        form.setValue('tempRemarks', [newRemarkObj], {shouldDirty: true});
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault(); // prevent new line
            saveRemark();
        }
    };
    // Clear channel fields and errors when switching to organization
    useEffect(() => {
        if (callType === 'organization') {
            // Clear channel fields completely
            form.setValue('channelParties', undefined);
            form.setValue('channelType', undefined);

            // Clear any validation errors for these fields
            form.clearErrors('channelParties');
            form.clearErrors('channelType');

            // Trigger form validation to clear any remaining errors
            setTimeout(() => {
                form.trigger(['channelParties', 'channelType']);
            }, 100);
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
                if (callType === 'organization') {
                    return true;
                }

                // If business partner is selected, validate channel type only
                if (callType === 'business-partner') {
                    const channelType = form.getValues('channelType');
                    if (!channelType) {
                        form.setError('channelType', {
                            type: 'required',
                            message: 'Please select channel type for business partner calls',
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
  // Create custom filters for customer relationship based on user group
  const customerCustomFilters = useMemo(() => {
    if (isBusinessPartner && accountData?.login) {
      // For business partners, only show customers created by them
      return {
        'createdBy.equals': accountData.login,
      };
    }
    // For non-business partners, show all customers
    return {};
  }, [isBusinessPartner, accountData?.login]);
  return (
    <div className="space-y-6">
      {/* First Row: Main Relationship Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Generated Form Fields */}

        {/* Generated Relationship Fields */}

        {/* Source Relationship */}
        <FormField
          control={form.control}
          name="source"
          render={({ field }) => (
            <RelationshipRenderer
              relConfig={{
                name: 'source',
                type: 'many-to-one',
                targetEntity: 'source',
                displayField: 'name',
                primaryKey: 'id',
                required: true,
                multiple: false,
                api: {
                  useGetAllHook: 'useGetAllSources',
                  useSearchHook: 'useSearchSources',
                  useCountHook: 'useCountSources',
                  entityName: 'Sources',
                },
                creation: {
                  canCreate: true,
                  createPath: '/sources/new',
                  createPermission: 'source:create:inline',
                },
                ui: { label: 'Source', placeholder: 'Select source', icon: '🏢' },
              }}
              field={field}
              form={form}
              actions={actions}
              config={config}
            />
          )}
        />

        {/* Customer Relationship - Enhanced with inline sheet creation */}
        <FormField
          control={form.control}
          name="customer"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Customer
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <EnhancedCustomerRelationshipField
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select customer"
                  canCreate={true}
                  createPermission="customer:create:inline"
                  customFilters={customerCustomFilters}
                  onCustomerCreated={(customerId) => {
                    // Optionally trigger any additional actions when customer is created
                    console.log('New customer created:', customerId);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Product Relationship - Enhanced with inline sheet creation */}
        <FormField
          control={form.control}
          name="product"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Product
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <EnhancedProductRelationshipField
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select product"
                  canCreate={true}
                  createPermission="product:create:inline"
                  onProductCreated={(productId) => {
                    // Optionally trigger any additional actions when product is created
                    console.log('New product created:', productId);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
          <div>
              <FormLabel htmlFor="remark">Remark</FormLabel>
              <div className="flex gap-2">
                  <Textarea
                      id="remark"
                      placeholder="Enter remark here..."
                      value={remarkText}
                      onChange={(e) => setRemarkText(e.target.value)}
                      onKeyDown={handleKeyPress}
                      onBlur={saveRemark}
                      rows={3}
                      className="flex-1 resize-none"
                  />
              </div>
          </div>
      </div>

      {/* Second Row: Business Relationship Radio Group */}
      <div className="space-y-4">
        <div>
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
              <Label
                htmlFor="business-partner"
                className="flex items-center gap-3 cursor-pointer flex-1"
              >
                <UserCheck className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Business Partner</div>
                  <div className="text-sm text-gray-500">External call</div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {/* Status Messages */}
          {callType === 'organization' && (
            <div className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg mt-4">
              ✓ Internal call selected - Ready to continue
            </div>
          )}
          {callType === 'business-partner' && (
            <div className="text-sm text-green-600 bg-green-50 p-3 rounded-lg mt-4">
              ✓ External call selected - Configure channel details below
            </div>
          )}
        </div>
      </div>

      {/* Third Row: Channel Details - Only show for Business Partner */}
      {callType === 'business-partner' && (
        <div className="space-y-4">
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
                    customFilters: { 'channelTypeId.specified': true },
                    api: {
                      useGetAllHook: 'useGetAllUserProfiles',
                      useSearchHook: 'useSearchUserProfiles',
                      useCountHook: 'useCountUserProfiles',
                      entityName: 'UserProfiles',
                    },
                    creation: {
                      canCreate: true,
                      createPath: '/invite-partners',
                      createPermission: 'invite-partners:create:inline',
                    },
                    ui: {
                      label: 'Channel Parties',
                      placeholder: 'Select channel parties',
                      icon: '👥',
                    },
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
                      sourceField: 'channelParties',
                      targetField: 'channelType',
                      sourceProperty: 'channelType',
                      allowOverride: true,
                    },
                    api: {
                      useGetAllHook: 'useGetAllChannelTypes',
                      useSearchHook: 'useSearchChannelTypes',
                      useCountHook: 'useCountChannelTypes',
                      entityName: 'ChannelTypes',
                    },
                    creation: {
                      canCreate: true,
                      createPath: '/channel-types/new',
                      createPermission: 'channelType:create:inline',
                    },
                    ui: { label: 'Channel Type', placeholder: 'Select channel type', icon: '📞' },
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
