// ===============================================================
// 🛑 MANUALLY GENERATED FILE - SAFE TO EDIT 🛑
// - Enhanced business step with integrated call remarks functionality
// - Allows adding remarks that are saved when call is created
// ===============================================================
"use client";

import React, { useState, useEffect } from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, MessageSquare, X } from "lucide-react";
import { RelationshipRenderer } from "../relationship-renderer";
import { CallRemark } from "../../../hooks/use-call-remarks";

interface CallBusinessStepProps {
  form: any;
  config: any;
  actions: any;
}

export function CallBusinessStep({ form, config, actions }: CallBusinessStepProps) {
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
    <div className="space-y-6">
      {/* Business Relationships */}
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
                api: {"useGetAllHook":"useGetAllSources","useSearchHook":"useSearchSources","useCountHook":"useCountSources","entityName":"Sources"},
                creation: {"canCreate":true,"createPath":"/sources/new","createPermission":"source:create:inline"},
                ui: {"label":"Source","placeholder":"Select source","icon":"🏢"},
              }}
              field={field}
              form={form}
              actions={actions}
              config={config}
            />
          )}
        />
        
        {/* Customer Relationship */}
        <FormField
          control={form.control}
          name="customer"
          render={({ field }) => (
            <RelationshipRenderer
              relConfig={{
                name: 'customer',
                type: 'many-to-one',
                targetEntity: 'customer',
                displayField: 'customerBusinessName',
                primaryKey: 'id',
                required: true,
                multiple: false,
                api: {"useGetAllHook":"useGetAllCustomers","useSearchHook":"useSearchCustomers","useCountHook":"useCountCustomers","entityName":"Customers"},
                creation: {"canCreate":true,"createPath":"/customers/new","createPermission":"customer:create:inline"},
                ui: {"label":"Customer","placeholder":"Select customer","icon":"🏢"},
              }}
              field={field}
              form={form}
              actions={actions}
              config={config}
            />
          )}
        />
        
        {/* Product Relationship */}
        <FormField
          control={form.control}
          name="product"
          render={({ field }) => (
            <RelationshipRenderer
              relConfig={{
                name: 'product',
                type: 'many-to-one',
                targetEntity: 'product',
                displayField: 'name',
                primaryKey: 'id',
                required: true,
                multiple: false,
                api: {"useGetAllHook":"useGetAllProducts","useSearchHook":"useSearchProducts","useCountHook":"useCountProducts","entityName":"Products"},
                creation: {"canCreate":true,"createPath":"/products/new","createPermission":"product:create:inline"},
                ui: {"label":"Product","placeholder":"Select product","icon":"🏢"},
              }}
              field={field}
              form={form}
              actions={actions}
              config={config}
            />
          )}
        />
      </div>

      <Separator />

      {/* Call Remarks Section */}
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
    </div>
  );
}
