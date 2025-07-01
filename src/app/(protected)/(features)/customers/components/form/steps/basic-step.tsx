"use client";

import React from "react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RelationshipRenderer } from "../relationship-renderer";

interface CustomerBasicStepProps {
  form: any;
  config: any;
  actions: any;
}

export function CustomerBasicStep({ form, config, actions }: CustomerBasicStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <p className="text-muted-foreground">Enter essential details</p>
        <p className="text-xs text-muted-foreground mt-2">
          <span className="text-red-500">*</span> means required fields - please fill these out
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Generated Form Fields */}
        
        {/* Customer Business Name Field */}
        <FormField
          control={form.control}
          name="customerBusinessName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Customer Business Name
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Enter customer business name"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    form.trigger('customerBusinessName');
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Email
              </FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="Enter email address (example: name@company.com)"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    form.trigger('email');
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Mobile Field */}
        <FormField
          control={form.control}
          name="mobile"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Mobile
                <span className="text-red-500 ml-1">*</span>
              </FormLabel>
              <FormControl>
                <Input
                  type="tel"
                  placeholder="Enter phone number (example: 03001234567)"
                  {...field}
                  onChange={(e) => {
                    // Allow only numbers, spaces, dashes, parentheses, and plus
                    const cleaned = e.target.value.replace(/[^\d\s\-\(\)\+]/g, '');
                    field.onChange(cleaned);
                    form.trigger('mobile');
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Whats App Field */}
        <FormField
          control={form.control}
          name="whatsApp"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Whats App
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Enter whats app"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    form.trigger('whatsApp');
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Contact Person Field */}
        <FormField
          control={form.control}
          name="contactPerson"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                Contact Person
              </FormLabel>
              <FormControl>
                <Input
                  type="text"
                  placeholder="Enter contact person"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    form.trigger('contactPerson');
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Generated Relationship Fields */}
      </div>
    </div>
  );
}
