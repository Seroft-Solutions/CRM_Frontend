// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
"use client";
import React, { useState, useEffect } from "react";
import {FormLabel} from "@/components/ui/form";

import { Plus, MessageSquare, X } from "lucide-react";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Textarea} from "@/components/ui/textarea";
import {Button} from "@/components/ui/button";
import { CallRemark } from "../../../hooks/use-call-remarks";

interface CallRemarksStepProps {
    form: any;
    config: any;
    actions: any;
}

export function CallRemarksStep({form, config, actions}: CallRemarksStepProps) {
    const [remarks, setRemarks] = useState<CallRemark[]>([]);
    const [newRemark, setNewRemark] = useState("");
    // Initialize remarks from form state on mount
    useEffect(() => {
        const existingRemarks = form.getValues('tempRemarks') || [];
        setRemarks(existingRemarks);
    }, [form]);

    // Update form state whenever remarks change
    useEffect(() => {
        form.setValue('tempRemarks', remarks, { shouldDirty: true });
    }, [remarks, form]);

    const addRemark = () => {
        if (!newRemark.trim()) return;

        const newRemarkObj: CallRemark = {
            id: Date.now().toString(),
            remark: newRemark.trim(),
            dateTime: new Date(),
        };

        setRemarks(prev => [...prev, newRemarkObj]);
        setNewRemark("");
    };

    const removeRemark = (id: string) => {
        setRemarks(prev => prev.filter(remark => remark.id !== id));
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            addRemark();
        }
    };
    return (
        <Card className="w-full">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-muted-foreground" />
                        <CardTitle className="text-lg font-semibold text-foreground">
                            Call Remarks
                        </CardTitle>
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
                            <Plus className="h-4 w-4" />
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
                                        <div className="text-sm whitespace-pre-wrap break-words">
                                            {remark.remark}
                                        </div>
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
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {remarks.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No remarks added yet</p>
                        <p className="text-xs">Add your first remark above</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
