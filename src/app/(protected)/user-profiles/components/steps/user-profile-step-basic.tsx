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


interface UserProfileStepBasicProps {
  form: UseFormReturn<any>;
}

export function UserProfileStepBasic({ form }: UserProfileStepBasicProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        
        <FormField
          control={form.control}
          name="keycloakId"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Keycloak Id *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter keycloak id"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Email *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter email"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">First Name</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter first name"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Last Name</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter last name"
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
