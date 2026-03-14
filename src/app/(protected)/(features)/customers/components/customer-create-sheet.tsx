'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus } from 'lucide-react';
import * as RPNInput from 'react-phone-number-input';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
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
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/phone-input';
import { IntelligentLocationField } from './intelligent-location-field';
import { useCreateCustomer } from '@/core/api/generated/spring/endpoints/customer-resource/customer-resource.gen';
import { customerToast, handleCustomerError } from './customer-toast';
import { useQueryClient } from '@tanstack/react-query';
import { InlinePermissionGuard } from '@/core/auth';
import type { AreaDTO, CustomerDTO } from '@/core/api/generated/spring/schemas';
import { CustomerDTOStatus } from '@/core/api/generated/spring/schemas';

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
  mobile: z.string({ message: 'Please enter mobile number' }).regex(/^[\+]?[0-9\s\-\(\)]{10,15}$/, {
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
  completeAddress: z
      .string({ message: 'Address is required' })
      .min(1, { message: 'Address is required' })
      .max(255, { message: 'Please enter no more than 255 characters' }),
  area: z.custom<AreaDTO>(
      (val) => {
        return val && typeof val === 'object' && 'id' in val && 'name' in val;
      },
      {
        message: 'Please select a location',
      }
  ),
});

type CustomerCreationFormData = z.infer<typeof customerCreationSchema>;

interface CustomerCreateSheetProps {
  onSuccess?: (customer: CustomerDTO) => void;
  trigger?: React.ReactNode;
  isBusinessPartner?: boolean;
}

const detectDefaultCountry = (): RPNInput.Country | undefined => {
  if (typeof window === 'undefined') {
    return undefined;
  }

  const localeCandidates = new Set<string>();

  if (navigator.language) {
    localeCandidates.add(navigator.language);
  }

  navigator.languages?.forEach((locale) => {
    if (locale) {
      localeCandidates.add(locale);
    }
  });

  const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;
  if (intlLocale) {
    localeCandidates.add(intlLocale);
  }

  for (const locale of localeCandidates) {
    const normalizedLocale = locale.replace('_', '-');
    const localeParts = normalizedLocale.split('-');
    const region = localeParts[localeParts.length - 1]?.toUpperCase();

    if (region && /^[A-Z]{2}$/.test(region) && RPNInput.isSupportedCountry(region as RPNInput.Country)) {
      return region as RPNInput.Country;
    }
  }

  return undefined;
};

const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation API is not available'));
      return;
    }

    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 10000,
      maximumAge: 300000,
    });
  });
};

const detectCountryFromLocation = async (): Promise<RPNInput.Country | undefined> => {
  const position = await getCurrentPosition();
  const latitude = position.coords.latitude;
  const longitude = position.coords.longitude;

  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=3&addressdetails=1`
  );

  if (!response.ok) {
    return undefined;
  }

  const data = (await response.json()) as {
    address?: {
      country_code?: string;
    };
  };

  const countryCode = data.address?.country_code?.toUpperCase();
  if (countryCode && RPNInput.isSupportedCountry(countryCode as RPNInput.Country)) {
    return countryCode as RPNInput.Country;
  }

  return undefined;
};

export function CustomerCreateSheet({
                                      onSuccess,
                                      trigger,
                                      isBusinessPartner = false,
                                    }: CustomerCreateSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [whatsAppManuallyEdited, setWhatsAppManuallyEdited] = useState(false);
  const [defaultPhoneCountry, setDefaultPhoneCountry] = useState<RPNInput.Country | undefined>(undefined);
  const queryClient = useQueryClient();

  const form = useForm<CustomerCreationFormData>({
    resolver: zodResolver(customerCreationSchema),
    defaultValues: {
      customerBusinessName: '',
      email: '',
      mobile: '',
      whatsApp: '',
      contactPerson: '',
      completeAddress: '',
      area: undefined,
    },
  });

  const { mutate: createCustomer, isPending } = useCreateCustomer({
    mutation: {
      onSuccess: (data) => {
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

        customerToast.created();

        setIsOpen(false);
        form.reset();
        setWhatsAppManuallyEdited(false);

        onSuccess?.(data);
      },
      onError: (error) => {
        handleCustomerError(error);
      },
    },
  });

  const onSubmit = (data: CustomerCreationFormData) => {
    const customerData: Partial<CustomerDTO> = {
      customerBusinessName: data.customerBusinessName,
      email: data.email || undefined,
      mobile: data.mobile,
      whatsApp: data.whatsApp || data.mobile,
      contactPerson: data.contactPerson || undefined,
      completeAddress: data.completeAddress || undefined,

      area: data.area,
      status: CustomerDTOStatus.ACTIVE,
    } as any;

    createCustomer({ data: customerData });
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      form.reset();
      setWhatsAppManuallyEdited(false);
    }
  };

  useEffect(() => {
    if (!isOpen || defaultPhoneCountry) {
      return;
    }

    let isMounted = true;

    const resolveDefaultCountry = async () => {
      try {
        const locationCountry = await detectCountryFromLocation();
        if (isMounted && locationCountry) {
          setDefaultPhoneCountry(locationCountry);
          return;
        }
      } catch {
        // If location permission is denied or lookup fails, fallback below.
      }

      const localeCountry = detectDefaultCountry();
      if (isMounted && localeCountry) {
        setDefaultPhoneCountry(localeCountry);
      }
    };

    void resolveDefaultCountry();

    return () => {
      isMounted = false;
    };
  }, [defaultPhoneCountry, isOpen]);

  return (
      <Sheet open={isOpen} onOpenChange={handleOpenChange}>
        <SheetTrigger asChild>
          {trigger || (
              <InlinePermissionGuard requiredPermission="customer:create">
                <Button
                    size="sm"
                    className="h-8 gap-1.5 bg-white text-blue-600 hover:bg-blue-50 text-xs font-medium"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Create</span>
                </Button>
              </InlinePermissionGuard>
          )}
        </SheetTrigger>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0 bg-slate-50">
          <div
              className={`sticky top-0 z-10 text-white shadow-sm ${isBusinessPartner
                  ? 'bg-bp-primary'
                  : 'bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700'
              }`}
          >
            <SheetHeader className="px-6 py-5 space-y-1">
              <SheetTitle
                  className={`text-lg font-semibold leading-tight ${isBusinessPartner ? 'text-bp-foreground' : 'text-white'
                  }`}
              >
                Create New Customer
              </SheetTitle>
              <SheetDescription
                  className={`text-sm ${isBusinessPartner ? 'text-bp-foreground' : 'text-blue-100'
                  }`}
              >
                Capture core customer details and select their location hierarchy.
              </SheetDescription>
            </SheetHeader>
          </div>

          <div className="px-6 py-5">
            <Form {...form}>
              <form
                  id="customer-creation-form"
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5"
              >
                {/* Basic Information Section */}
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-900">Basic Information</h3>
                    <p className="text-xs text-slate-500">
                      Provide the key identifiers used across customer journeys.
                    </p>
                  </div>

                  <FormField
                      control={form.control}
                      name="customerBusinessName"
                      render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-slate-700">
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
                            <FormLabel className="text-sm font-semibold text-slate-700">
                              Contact Person
                            </FormLabel>
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
                            <FormLabel className="text-sm font-semibold text-slate-700">
                              Email Address
                            </FormLabel>
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
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-900">Contact Information</h3>
                    <p className="text-xs text-slate-500">
                      Phone numbers the team will use for day-to-day communication.
                    </p>
                  </div>

                  <FormField
                      control={form.control}
                      name="mobile"
                      render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-slate-700">
                              Mobile Number
                              <span className="text-red-500 ml-1">*</span>
                            </FormLabel>
                            <FormControl>
                              <PhoneInput
                                  key={`customer-mobile-${defaultPhoneCountry ?? 'auto'}`}
                                  placeholder="Enter mobile number"
                                  value={field.value}
                                  defaultCountry={defaultPhoneCountry}
                                  onChange={(value) => {
                                    field.onChange(value);

                                    if (!whatsAppManuallyEdited && value) {
                                      setTimeout(() => {
                                        const currentWhatsApp = form.getValues('whatsApp');

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
                            <FormLabel className="text-sm font-semibold text-slate-700">
                              WhatsApp Number
                            </FormLabel>
                            <FormControl>
                              <PhoneInput
                                  key={`customer-whatsapp-${defaultPhoneCountry ?? 'auto'}`}
                                  placeholder="Enter WhatsApp number"
                                  value={field.value}
                                  defaultCountry={defaultPhoneCountry}
                                  onChange={(value) => {
                                    field.onChange(value);

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
                <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-900">Location</h3>
                    <p className="text-xs text-slate-500">
                      Search for the area to automatically attach its full hierarchy.
                    </p>
                  </div>

                  <FormField
                      control={form.control}
                      name="area"
                      render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-slate-700">
                              City and Zipcode
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

                  <FormField
                      control={form.control}
                      name="completeAddress"
                      render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-slate-700">
                              Address
                              <span className="text-red-500 ml-1">*</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                  placeholder="Enter address"
                                  {...field}
                                  className="resize-none min-h-[80px] transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
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

          <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t px-6 py-3">
            <div className="flex items-center justify-end gap-2">
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
                  className={`min-w-[160px] ${isBusinessPartner
                      ? 'bg-bp-primary hover:bg-bp-primary-hover text-bp-foreground'
                      : ''
                  }`}
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
            </div>
          </div>
        </SheetContent>
      </Sheet>
  );
}
