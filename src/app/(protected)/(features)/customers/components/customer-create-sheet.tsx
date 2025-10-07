'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { IntelligentLocationField } from './intelligent-location-field';
import { useCreateCustomer } from '@/core/api/generated/spring/endpoints/customer-resource/customer-resource.gen';
import { customerToast, handleCustomerError } from './customer-toast';
import { useQueryClient } from '@tanstack/react-query';
import { InlinePermissionGuard } from '@/core/auth';
import type { CustomerDTO, AreaDTO } from '@/core/api/generated/spring/schemas';
import { CustomerDTOStatus } from '@/core/api/generated/spring/schemas';


// Create simplified form schema for customer creation with AreaDTO
const customerCreationSchema = z.object({
  customerBusinessName: z
    .string({ message: 'Please enter business name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(100, { message: 'Please enter no more than 100 characters' }),
  email: z
    .string()
    .email({ message: 'Please enter a valid email address' })
    .max(254, { message: 'Please enter no more than 254 characters' })
    .optional()
    .or(z.literal('')),
  mobile: z
    .string({ message: 'Please enter mobile number' })
    .regex(/^[\+]?[0-9\s\-\(\)]{10,15}$/, {
      message: 'Please enter a valid phone number (10-15 digits)',
    }),
  whatsApp: z
    .string()
    .regex(/^[\+]?[0-9\s\-\(\)]{10,15}$/, {
      message: 'Please enter a valid phone number (10-15 digits)',
    })
    .optional()
    .or(z.literal('')),
  contactPerson: z
    .string()
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(100, { message: 'Please enter no more than 100 characters' })
    .optional()
    .or(z.literal('')),
  area: z.custom<AreaDTO>((val) => {
    return val && typeof val === 'object' && 'id' in val && 'name' in val;
  }, {
    message: 'Please select a location',
  }),
});

type CustomerCreationFormData = z.infer<typeof customerCreationSchema>;

interface CustomerCreateSheetProps {
  onSuccess?: (customer: CustomerDTO) => void;
  trigger?: React.ReactNode;
}

export function CustomerCreateSheet({ onSuccess, trigger }: CustomerCreateSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [whatsAppManuallyEdited, setWhatsAppManuallyEdited] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<CustomerCreationFormData>({
    resolver: zodResolver(customerCreationSchema),
    defaultValues: {
      customerBusinessName: '',
      email: '',
      mobile: '',
      whatsApp: '',
      contactPerson: '',
      area: undefined,
    },
  });

  const { mutate: createCustomer, isPending } = useCreateCustomer({
    mutation: {
      onSuccess: (data) => {
        // Invalidate queries to trigger table refetch
        queryClient.invalidateQueries({
          queryKey: ['getAllCustomers'],
          refetchType: 'active',
        });
        queryClient.invalidateQueries({
          queryKey: ['countCustomers'],
          refetchType: 'active',
        });
        queryClient.invalidateQueries({
          queryKey: ['searchCustomers'],
          refetchType: 'active',
        });

        // Show success toast
        customerToast.created();
        
        // Close sheet and reset form
        setIsOpen(false);
        form.reset();
        setWhatsAppManuallyEdited(false);
        
        // Call the success callback with the created customer
        // This will trigger auto-selection in the parent field
        onSuccess?.(data);
      },
      onError: (error) => {
        handleCustomerError(error);
      },
    },
  });

  const onSubmit = (data: CustomerCreationFormData) => {
    // Transform the data to match the exact API format (CustomerDTO)
    const customerData: Partial<CustomerDTO> = {
      customerBusinessName: data.customerBusinessName,
      email: data.email || undefined,
      mobile: data.mobile,
      whatsApp: data.whatsApp || data.mobile, // Default to mobile if whatsApp is empty
      contactPerson: data.contactPerson || undefined,
      // Only send the area with its full hierarchy (backend derives state/district/city)
      area: data.area,
      status: CustomerDTOStatus.ACTIVE,
    };

    createCustomer({ data: customerData });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
      setWhatsAppManuallyEdited(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {trigger || (
          <InlinePermissionGuard requiredPermission="customer:create">
            <Button size="sm" className="h-8 gap-1.5 bg-white text-blue-600 hover:bg-blue-50 text-xs font-medium">
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Create</span>
            </Button>
          </InlinePermissionGuard>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        <div className="sticky top-0 bg-white z-10 border-b px-6 py-4">
          <SheetHeader>
            <SheetTitle>Create New Customer</SheetTitle>
            <SheetDescription>
              Add a new customer to your database. Fill in the required information below.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="px-6 py-6">
          <Form {...form}>
            <form 
              id="customer-creation-form"
              onSubmit={form.handleSubmit(onSubmit)} 
              className="space-y-6"
            >
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-sm font-medium text-gray-900">Basic Information</h3>
                <p className="text-xs text-gray-500 mt-1">Essential customer details</p>
              </div>

              <FormField
                control={form.control}
                name="customerBusinessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Business Name
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter business name"
                        {...field}
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
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
                        placeholder="Enter contact person name"
                        {...field}
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
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
                    <FormLabel className="text-sm font-medium">Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter email address"
                        {...field}
                        className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Contact Information Section */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-sm font-medium text-gray-900">Contact Information</h3>
                <p className="text-xs text-gray-500 mt-1">Phone numbers for communication</p>
              </div>

              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Mobile Number
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <PhoneInput
                        placeholder="Enter mobile number"
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value);
                          // Auto-populate WhatsApp if it hasn't been manually edited
                          if (!whatsAppManuallyEdited && value) {
                            // Use a slight delay to avoid interference with PhoneInput formatting
                            setTimeout(() => {
                              const currentWhatsApp = form.getValues('whatsApp');
                              // Only update if WhatsApp hasn't been manually changed
                              if (!whatsAppManuallyEdited) {
                                form.setValue('whatsApp', value, { shouldValidate: false });
                              }
                            }, 50);
                          }
                        }}
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
                    <FormLabel className="text-sm font-medium">WhatsApp Number</FormLabel>
                    <FormControl>
                      <PhoneInput
                        placeholder="Enter WhatsApp number"
                        value={field.value}
                        onChange={(value) => {
                          field.onChange(value);
                          // Mark as manually edited when user types in WhatsApp field
                          setWhatsAppManuallyEdited(true);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Location Information Section */}
            <div className="space-y-4">
              <div className="border-b pb-2">
                <h3 className="text-sm font-medium text-gray-900">Location</h3>
                <p className="text-xs text-gray-500 mt-1">Search and select customer location</p>
              </div>

              <FormField
                control={form.control}
                name="area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Address
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <IntelligentLocationField
                        value={field.value}
                        onChange={field.onChange}
                        onError={(error) => {
                          form.setError('area', { message: error });
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

          </form>
        </Form>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
          <SheetFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="customer-creation-form"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Customer...
                </>
              ) : (
                'Create Customer'
              )}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}