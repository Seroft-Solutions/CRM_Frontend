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


interface ProductStepBasicProps {
  form: UseFormReturn<any>;
}

export function ProductStepBasic({ form }: ProductStepBasicProps) {
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
          name="code"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Code *</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter code"
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
        
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Category</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  
                  placeholder="Enter category"
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
        
        <FormField
          control={form.control}
          name="basePrice"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Base Price</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  type="number"
                  placeholder="Enter base price"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="minPrice"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Min Price</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  type="number"
                  placeholder="Enter min price"
                  className="transition-colors"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            
          )}
        />
        
        <FormField
          control={form.control}
          name="maxPrice"
          render={({ field }) => (
            
            <FormItem>
              <FormLabel className="text-sm font-medium">Max Price</FormLabel>
              <FormControl>
                <Input 
                  {...field}
                  type="number"
                  placeholder="Enter max price"
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
