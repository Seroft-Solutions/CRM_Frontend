"use client";

import React from "react";
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";


interface GroupStepBasicProps {
  form: UseFormReturn<any>;
}

export function GroupStepBasic({ form }: GroupStepBasicProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        
        <FormField
          control={form.control}
          name="keycloakGroupId"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Keycloak Group Id *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter keycloak group id"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Name *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter name"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="path"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Path *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter path"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Description</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter description"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
      </div>
    </div>
  );
}
