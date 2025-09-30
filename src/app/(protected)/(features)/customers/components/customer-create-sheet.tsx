'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { customerFormSchema } from './form/customer-form-schema';
import { customerToast, handleCustomerError } from './customer-toast';
import { useQueryClient } from '@tanstack/react-query';
import { InlinePermissionGuard } from '@/core/auth';
import type { CustomerDTO, CustomerDTOStatus } from '@/core/api/generated/spring/schemas';

// Create simplified form schema for customer creation
const customerCreationSchema = customerFormSchema.omit({
  status: true,
}).extend({
  location: customerFormSchema.pick({
    state: true,
    district: true,
    city: true,
    area: true,
  }),
});

type CustomerCreationFormData = {
  customerBusinessName: string;
  email?: string;
  mobile: string;
  whatsApp?: string;
  contactPerson?: string;
  location: {
    state: number;
    district: number;
    city: number;
    area: number;
  };
};

interface CustomerCreateSheetProps {
  onSuccess?: (customer: CustomerDTO) => void;
  trigger?: React.ReactNode;
}

export function CustomerCreateSheet({ onSuccess, trigger }: CustomerCreateSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<CustomerCreationFormData>({
    resolver: zodResolver(customerCreationSchema),
    defaultValues: {
      customerBusinessName: '',
      email: '',
      mobile: '',
      whatsApp: '',
      contactPerson: '',
      location: {
        state: 0,
        district: 0,
        city: 0,
        area: 0,
      },
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
      // Create proper nested objects for location entities as required by generated schema
      state: { 
        id: data.location.state,
        name: '', // Will be populated by backend
        country: '', // Will be populated by backend  
        status: CustomerDTOStatus.ACTIVE
      },
      district: { 
        id: data.location.district,
        name: '', // Will be populated by backend
        status: CustomerDTOStatus.ACTIVE,
        state: { id: data.location.state } as any
      },
      city: { 
        id: data.location.city,
        name: '', // Will be populated by backend
        status: CustomerDTOStatus.ACTIVE,
        district: { id: data.location.district } as any
      },
      area: { 
        id: data.location.area,
        name: '', // Will be populated by backend
        status: CustomerDTOStatus.ACTIVE,
        city: { id: data.location.city } as any
      },
      status: CustomerDTOStatus.ACTIVE,
    };

    createCustomer({ data: customerData });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
    }
  };

  // Auto-populate WhatsApp when mobile changes and validate location
  React.useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'mobile' && value.mobile && !value.whatsApp) {
        form.setValue('whatsApp', value.mobile);
      }
      // Check location completeness for validation
      if (name?.startsWith('location.')) {
        const location = value.location;
        if (location && location.state && location.district && location.city && location.area) {
          // Clear any location errors if all fields are now filled
          form.clearErrors('location');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

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
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Create New Customer</SheetTitle>
          <SheetDescription>
            Add a new customer to your database. Fill in the required information below.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form 
            id="customer-creation-form"
            onSubmit={form.handleSubmit(onSubmit)} 
            className="space-y-6 mt-6"
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
                          // Auto-populate WhatsApp if it's empty
                          if (!form.getValues('whatsApp')) {
                            form.setValue('whatsApp', value);
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
                        onChange={field.onChange}
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
                <p className="text-xs text-gray-500 mt-1">Geographic information</p>
              </div>

              <FormField
                control={form.control}
                name="location"
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
                          form.setError('location', { message: error });
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
      </SheetContent>
    </Sheet>
  );
}