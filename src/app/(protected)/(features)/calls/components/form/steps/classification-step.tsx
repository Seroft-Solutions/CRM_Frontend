'use client';

import React, {useEffect} from 'react';
import {
    FormField,
} from '@/components/ui/form';
import {RelationshipRenderer} from '../relationship-renderer';
import {getAllCallStatuses, getAllPriorities} from "@/core/api/generated/spring";

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

    // Fetch call statuses and set default value for callStatus field
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

    // Fetch priorities and set default value for priority field
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
                        render={({field}) => (
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
                                    ui: {label: 'Priority', placeholder: 'Select priority', icon: '🏷️'},
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
                        render={({field}) => (
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
                                    ui: {label: 'Call Type', placeholder: 'Select call type', icon: '🏷️'},
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
                        render={({field}) => (
                            <RelationshipRenderer
                                relConfig={{
                                    name: 'subCallType',
                                    type: 'many-to-one',
                                    targetEntity: 'subCallType',
                                    displayField: 'name',
                                    primaryKey: 'id',
                                    required: false,
                                    multiple: false,
                                    cascadingFilter: {parentField: 'callType', filterField: 'callType'},
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
                                    ui: {label: 'Sub Call Type', placeholder: 'Select sub call type', icon: '🏷️'},
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
                        render={({field}) => (
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
                                    ui: {label: 'Call Status', placeholder: 'Select call status', icon: '🏷️'},
                                }}
                                field={field}
                                form={form}
                                actions={actions}
                                config={config}
                            />
                        )}
                    />

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
                                    customFilters: {'channelTypeId.specified': false},
                                    api: {
                                        useGetAllHook: 'useGetAllUserProfiles',
                                        useSearchHook: 'useSearchUserProfiles',
                                        useCountHook: 'useCountUserProfiles',
                                        entityName: 'UserProfiles',
                                    },
                                    creation: {
                                        canCreate: true,
                                        createPath: '/user-profiles/new',
                                        createPermission: 'userProfile:create:inline',
                                    },
                                    ui: {label: 'Assigned To', placeholder: 'Select assigned to', icon: '👤'},
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
        </>
    );
}