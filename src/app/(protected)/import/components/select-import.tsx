// ===============================================================
// 🛑 AUTO-GENERATED INSPIRED FILE – CUSTOMIZATION ALLOWED 🛑
// - Inspired by: form-step-renderer.tsx
// - To customize: Edit directly or use feature-level extensions
// - This file demonstrates a select field that drives dynamic rendering
//   via a resolver component with switch-based sub-component calls
// ===============================================================

'use client';

import React, { useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Form } from '@/components/ui/form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button'; // Assuming you have Button for demo purposes
import { useForm } from 'react-hook-form'; // Assuming you're using react-hook-form as in the original

import {
    useGetAllStates,
} from '@/core/api/generated/spring/endpoints/state-resource/state-resource.gen';
import {
    useGetAllDistricts,
} from '@/core/api/generated/spring/endpoints/district-resource/district-resource.gen';
import {
    useGetAllCities,
} from '@/core/api/generated/spring/endpoints/city-resource/city-resource.gen';
import {
    useGetAllAreas,
} from '@/core/api/generated/spring/endpoints/area-resource/area-resource.gen';
import {CallTypeImport} from "@/app/(protected)/import/components/import-data-types/call-type-import";
import {SubCallTypeImport} from "@/app/(protected)/import/components/import-data-types/sub-call-type-import";
import {CallStatusImport} from "@/app/(protected)/import/components/import-data-types/call-statuses-import";
import {PriorityImport} from "@/app/(protected)/import/components/import-data-types/priorities-import";
import {SourceImport} from "@/app/(protected)/import/components/import-data-types/sources-import";
import {ChannelTypeImport} from "@/app/(protected)/import/components/import-data-types/channel-types-import";
import {CustomerImport} from "@/app/(protected)/import/components/import-data-types/customers-import";
import {ProductImport} from "@/app/(protected)/import/components/import-data-types/products-import";
import {CallImport} from "@/app/(protected)/import/components/import-data-types/calls-import";

// Demo entity data (replace with actual props or context)
const demoEntity = {
    stateId: 1, // Example value for state
    districtId: 2, // Example value for district
    cityId: 3, // Example value for city
    areaId: 4, // Example value for area
};

// Generic component to display a single relationship value
function DynamicDisplayValue({
                                 value,
                                 useGetAllHook,
                                 displayField,
                                 primaryKey,
                                 label,
                             }: {
    value: any;
    useGetAllHook: any;
    displayField: string;
    primaryKey: string;
    label: string;
}) {
    // Fetch all data to resolve display values
    const { data: allData } = useGetAllHook(
        { page: 0, size: 1000 }, // Get enough data to resolve most relationships
        {
            query: {
                enabled: !!value, // Only fetch if there's a value to resolve
                staleTime: 5 * 60 * 1000, // Cache for 5 minutes
            },
        }
    );

    if (!value) {
        return <span className="text-muted-foreground italic">Not selected</span>;
    }

    if (!allData) {
        return <span className="text-muted-foreground italic">Loading...</span>;
    }

    // Extract data array from response (handle both direct array and paginated response)
    const dataArray = Array.isArray(allData)
        ? allData
        : allData.content
            ? allData.content
            : allData.data
                ? allData.data
                : [];

    // Single value (assuming non-multiple for simplicity)
    const selectedItem = dataArray.find((item: any) => item[primaryKey] === value);

    return selectedItem ? (
        <div>
            <div className="text-xs font-medium text-muted-foreground">{label}</div>
            <div className="text-sm font-semibold text-foreground">{selectedItem[displayField]}</div>
        </div>
    ) : (
        <span className="text-muted-foreground italic">Selected (ID: {value})</span>
    );
}

// Resolver component that switches on the selected type and renders the appropriate display
function TypeValueResolver({ selectedType, entity }: { selectedType: string; entity: any }) {
    // Extract value based on selected type
    const getValueForType = () => {
        switch (selectedType) {
            case 'state':
                return entity.stateId;
            case 'district':
                return entity.districtId;
            case 'city':
                return entity.cityId;
            case 'area':
                return entity.areaId;
            default:
                return null;
        }
    };

    const value = getValueForType();

    // Use switches to call the appropriate component in return
    const resolveDisplay = () => {
        switch (selectedType) {
            case 'callType':
                return (
                    <CallTypeImport />
                );

            case 'subCallType':
                return (
                    <SubCallTypeImport/>
                );

            case 'callStatus':
                return (
                   <CallStatusImport/>
                );

            case 'priority':
                return (
                    <PriorityImport/>
                );

            case 'source':
                return (
                   <SourceImport/>
                );
            case 'channelType':
                return (
                    <ChannelTypeImport/>
                );
            case 'customer':
                return (
                   <CustomerImport/>
                );
            case 'product':
                return (
                    <ProductImport/>
                );
            case 'call':
                return (
                   <CallImport/>
                );

            default:
                return (
                  <CallTypeImport/>
                );
        }
    };

    return (
        // <div className="mt-4 p-4 border rounded-lg bg-card">
        //     <h4 className="font-semibold mb-2">Selected {selectedType} Display:</h4>
            resolveDisplay()
        // </div>
    );
}

// Main component: Includes a select field and passes its value to the resolver
export function DynamicTypeSelector() {
    const form = useForm({
        defaultValues: {
            selectedType: 'state', // Default selection
        },
    });

    const selectedType = form.watch('selectedType');

    // Optional: Effect to log or handle changes (demo)
    useEffect(() => {
        console.log('Selected Type Changed:', selectedType);
    }, [selectedType]);

    const handleSubmit = (data: any) => {
        console.log('Form Submitted:', data);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <Card>
                    <CardContent className="p-4 sm:p-6">
                        {/* Select Field for choosing the type */}
                        <FormField
                            control={form.control}
                            name="selectedType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-sm font-medium">
                                        Select Type <span className="text-red-500 ml-1">*</span>
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={"callType"}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose a type..." />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="callType">Call Type</SelectItem>
                                            <SelectItem value="subCallType">Sub Call Type</SelectItem>
                                            <SelectItem value="callStatus">Call Status</SelectItem>
                                            <SelectItem value="priority">Priority</SelectItem>
                                            <SelectItem value="source">Source</SelectItem>
                                            <SelectItem value="channelType">Channel Type</SelectItem>
                                            <SelectItem value="customer">Customer</SelectItem>
                                            <SelectItem value="product">Product</SelectItem>
                                            <SelectItem value="call">Call</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Pass the select value to the new resolver component */}
                        {selectedType && (
                            <TypeValueResolver selectedType={selectedType} entity={demoEntity} />
                        )}

                        {/* Demo Submit Button */}
                        <Button type="submit" className="mt-4">
                            Submit
                        </Button>
                    </CardContent>
                </Card>
            </form>
        </Form>
    );
}