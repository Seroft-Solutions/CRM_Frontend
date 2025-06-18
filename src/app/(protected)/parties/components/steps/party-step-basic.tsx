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


interface PartyStepBasicProps {
  form: UseFormReturn<any>;
}

export function PartyStepBasic({ form }: PartyStepBasicProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        
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
          name="mobile"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Mobile *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter mobile"
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
              <FormLabel className="text-sm font-medium">Email</FormLabel>
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
          name="whatsApp"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Whats App</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter whats app"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="contactPerson"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Contact Person</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter contact person"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="address1"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Address1</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter address1"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="address2"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Address2</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter address2"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="address3"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Address3</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter address3"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="remark"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Remark</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter remark"
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
