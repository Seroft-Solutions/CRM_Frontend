// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
'use client';

import React, {useEffect, useState} from 'react';
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
} from '@/components/ui/form';
import {Input} from '@/components/ui/input';
import {RelationshipRenderer} from '../relationship-renderer';
import {formatLeadNoForDisplay} from '../../../utils/leadNo-generator';
import {getAllCallStatuses, getAllPriorities} from "@/core/api/generated/spring";
import {CallRemark} from "@/app/(protected)/(features)/calls/hooks/use-call-remarks";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {MessageSquare, Plus, X} from "lucide-react";
import {Badge} from "@/components/ui/badge";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";

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
    const [remarks, setRemarks] = useState<CallRemark[]>([]);
    const [newRemark, setNewRemark] = useState('');
    // Initialize remarks from form state on mount
    useEffect(() => {
        const existingRemarks = form.getValues('tempRemarks') || [];
        setRemarks(existingRemarks);
    }, [form]);

    // Update form state whenever remarks change
    useEffect(() => {
        form.setValue('tempRemarks', remarks, {shouldDirty: true});
    }, [remarks, form]);

    const addRemark = () => {
        if (!newRemark.trim()) return;

        const newRemarkObj: CallRemark = {
            id: Date.now().toString(),
            remark: newRemark.trim(),
            dateTime: new Date(),
        };

        setRemarks((prev) => [...prev, newRemarkObj]);
        setNewRemark('');
    };

    const removeRemark = (id: string) => {
        setRemarks((prev) => prev.filter((remark) => remark.id !== id));
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            addRemark();
        }
    };
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
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
                    <FormField
                        control={form.control}
                        name="leadNo"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel className="flex items-center gap-2">🏷️ Lead Number</FormLabel>
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
            </div>

            {/* Add margin-top to create space between the grid and the card */}
            <Card className="w-full mt-6">
                <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-muted-foreground"/>
                            <CardTitle className="text-lg font-semibold text-foreground">Call Remarks</CardTitle>
                            <Badge variant="secondary" className="text-xs">
                                {remarks.length}
                            </Badge>
                        </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Add remarks that will be saved when the call is created
                    </p>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Add New Remark */}
                    <div className="space-y-2">
                        <FormLabel htmlFor="new-remark">Add Remark</FormLabel>
                        <div className="flex gap-2">
                            <Textarea
                                id="new-remark"
                                placeholder="Enter your remark here... (Ctrl+Enter to add)"
                                value={newRemark}
                                onChange={(e) => setNewRemark(e.target.value)}
                                onKeyDown={handleKeyPress}
                                rows={3}
                                className="flex-1 resize-none"
                            />
                            <Button
                                type="button"
                                onClick={addRemark}
                                disabled={!newRemark.trim()}
                                size="sm"
                                className="px-3 self-start mt-1"
                            >
                                <Plus className="h-4 w-4"/>
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Press Ctrl+Enter to quickly add a remark
                        </p>
                    </div>

                    {/* Existing Remarks */}
                    {remarks.length > 0 && (
                        <div className="space-y-3">
                            <FormLabel className="text-sm font-medium">
                                Remarks to be saved ({remarks.length})
                            </FormLabel>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {remarks.map((remark) => (
                                    <div
                                        key={remark.id}
                                        className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border-l-2 border-primary/20"
                                    >
                                        <div className="flex-1 space-y-1">
                                            <div
                                                className="text-sm whitespace-pre-wrap break-words">{remark.remark}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {remark.dateTime.toLocaleString()}
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeRemark(remark.id)}
                                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                                        >
                                            <X className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {remarks.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground">
                            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50"/>
                            <p className="text-sm">No remarks added yet</p>
                            <p className="text-xs">Add your first remark above</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
