'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RelationshipRenderer } from '../relationship-renderer';
import { EnhancedCustomerRelationshipField } from '@/app/(protected)/(features)/customers/components/enhanced-customer-relationship-field';
import { EnhancedProductRelationshipField } from '@/app/(protected)/(features)/products/components/enhanced-product-relationship-field';
import { useUserAuthorities } from '@/core/auth';
import { useAccount } from '@/core/auth';
import { useEntityForm } from '@/app/(protected)/(features)/calls/components/form/call-form-provider';
import { UserCheck } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { CallRemark } from '@/app/(protected)/(features)/calls/hooks/use-call-remarks';

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

  useEffect(() => {
    if (isBusinessPartner) {
      setCallType('business-partner');
    }
  }, [isBusinessPartner]);

  useEffect(() => {
    const event = new CustomEvent('businessPartnerToggle', {
      detail: { enabled: callType === 'business-partner' },
    });
    window.dispatchEvent(event);
  }, [callType]);

  useEffect(() => {
    const existingRemarks = form.getValues('tempRemarks') || [];
    if (existingRemarks.length > 0) {
      setRemarkText(existingRemarks[0].remark);
    }
  }, [form]);

  const saveRemark = () => {
    const trimmedRemark = remarkText.trim();
    if (!trimmedRemark) {
      form.setValue('tempRemarks', [], { shouldDirty: true });
      return;
    }

    const existingRemarks = form.getValues('tempRemarks') || [];
    const newRemarkObj: CallRemark = {
      id: existingRemarks.length > 0 ? existingRemarks[0].id : Date.now().toString(),
      remark: trimmedRemark,
      dateTime: new Date(),
    };

    form.setValue('tempRemarks', [newRemarkObj], { shouldDirty: true });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      saveRemark();
    }
  };

  useEffect(() => {
    if (callType !== 'business-partner') {
      form.setValue('channelParties', undefined);
      form.setValue('channelType', undefined);

      form.clearErrors('channelParties');
      form.clearErrors('channelType');

      setTimeout(() => {
        form.trigger(['channelParties', 'channelType']);
      }, 100);
    }
  }, [callType, form]);

  useEffect(() => {
    const originalValidateStep = formActions.validateStep;

    const customValidateStep = async (stepIndex?: number): Promise<boolean> => {
      const currentStepIndex = stepIndex ?? state.currentStep;
      const currentStepConfig = config.steps[currentStepIndex];

      if (currentStepConfig?.id === 'business') {
        if (callType === 'business-partner') {
          const channelType = form.getValues('channelType');
          if (!channelType) {
            form.setError('channelType', {
              type: 'required',
              message: 'Please select channel type for business partner calls',
            });
            return false;
          }
        }

        return true;
      }

      return originalValidateStep(stepIndex);
    };

    formActions.validateStep = customValidateStep;

    return () => {
      formActions.validateStep = originalValidateStep;
    };
  }, [callType, form, formActions, config, state.currentStep]);

  const customerCustomFilters = useMemo(() => {
    if (isBusinessPartner && accountData?.login) {
      return {
        'createdBy.equals': accountData.login,
      };
    }

    return {};
  }, [isBusinessPartner, accountData?.login]);
  return (
    <div className="space-y-6">
      {/* First Row: Main Relationship Fields + Business Partner Toggle */}
      {/* Use 3-column layout for business partners, 4-column for others */}
      <div
        className={`grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 ${
          isBusinessPartner ? 'xl:grid-cols-3' : 'xl:grid-cols-4'
        }`}
      >
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
                  buttonClassName={
                    callType === 'business-partner' ? 'bg-bp-primary hover:bg-bp-primary-hover' : ''
                  }
                  onCustomerCreated={(customerId) => {
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
                  buttonClassName={
                    callType === 'business-partner' ? 'bg-bp-primary hover:bg-bp-primary-hover' : ''
                  }
                  onProductCreated={(productId) => {
                    console.log('New product created:', productId);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Business Partner Toggle - 4th Column - Hidden for Business Partner users */}
        {!isBusinessPartner && (
          <div>
            <FormLabel className="text-sm font-medium mb-2 block invisible">Toggle</FormLabel>
            <div
              className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                callType === 'business-partner'
                  ? 'bg-bp-50 border-bp-primary hover:bg-bp-50'
                  : 'hover:bg-gray-50 border-gray-200'
              }`}
              onClick={() => setCallType(callType === 'business-partner' ? '' : 'business-partner')}
            >
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  callType === 'business-partner'
                    ? 'bg-bp-primary border-bp-primary'
                    : 'border-gray-300 bg-white'
                }`}
              >
                {callType === 'business-partner' && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <UserCheck
                  className={`h-4 w-4 flex-shrink-0 ${
                    callType === 'business-partner' ? 'text-bp-600' : 'text-gray-500'
                  }`}
                />
                <div className="min-w-0">
                  <div
                    className={`font-medium text-sm ${
                      callType === 'business-partner' ? 'text-bp-900' : 'text-gray-900'
                    }`}
                  >
                    Business Partner
                  </div>
                  <div
                    className={`text-xs ${
                      callType === 'business-partner' ? 'text-bp-700' : 'text-gray-500'
                    }`}
                  >
                    Enable for external calls
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Channel Details - Only show when Business Partner is toggled by non-business partner users */}
      {callType === 'business-partner' && !isBusinessPartner && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
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
                    required: false,
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
                      buttonClassName: 'bg-bp-primary hover:bg-bp-primary-hover',
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
                    required: false,
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
                    ui: {
                      label: 'Channel Type',
                      placeholder: 'Select channel type',
                      icon: '📞',
                      buttonClassName: 'bg-bp-primary hover:bg-bp-primary-hover',
                    },
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

      {/* Remark Component - Always visible at the bottom */}
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
            rows={1}
            className="flex-1 resize-none !h-10"
          />
        </div>
      </div>
    </div>
  );
}
