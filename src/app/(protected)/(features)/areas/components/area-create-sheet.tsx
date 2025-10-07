'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Loader2, Check, ChevronsUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useCreateArea } from '@/core/api/generated/spring/endpoints/area-resource/area-resource.gen';
import { useSearchCitiesWithHierarchy } from '@/core/api/generated/spring/endpoints/city-resource/city-resource.gen';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { AreaDTO, CityDTO } from '@/core/api/generated/spring/schemas';
import { cn } from '@/lib/utils';

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Simplified schema for area creation
const areaCreationSchema = z.object({
  name: z
    .string({ message: 'Please enter area name' })
    .min(2, { message: 'Please enter at least 2 characters' })
    .max(100, { message: 'Please enter no more than 100 characters' }),
  pincode: z
    .string({ message: 'Please enter pincode' })
    .length(6, { message: 'Pincode must be exactly 6 digits' })
    .regex(/^[0-9]{6}$/, { message: 'Please enter a valid 6-digit pincode' }),
  status: z.string().default('ACTIVE'),
  cityId: z.number({ message: 'Please select a city' }),
});

type AreaCreationFormData = z.infer<typeof areaCreationSchema>;

interface AreaCreateSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (area: AreaDTO) => void;
}

export function AreaCreateSheet({ isOpen, onOpenChange, onSuccess }: AreaCreateSheetProps) {
  const queryClient = useQueryClient();
  const [citySearchOpen, setCitySearchOpen] = useState(false);
  const [citySearchTerm, setCitySearchTerm] = useState('');
  const [cityPage, setCityPage] = useState(0);
  const [allCities, setAllCities] = useState<CityDTO[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);
  const prevSearchTermRef = useRef<string>('');

  const form = useForm<AreaCreationFormData>({
    resolver: zodResolver(areaCreationSchema),
    defaultValues: {
      name: '',
      pincode: '',
      status: 'ACTIVE',
      cityId: undefined,
    },
  });

  // Debounce search term to reduce API calls
  const debouncedSearchTerm = useDebounce(citySearchTerm, 500);

  // Server-side search with pagination
  const { data: citiesResponse, isLoading: isLoadingCities, isFetching } = useSearchCitiesWithHierarchy(
    {
      term: debouncedSearchTerm || '',
      page: cityPage,
      size: 50,
    },
    {
      query: {
        queryKey: ['searchCitiesWithHierarchy', debouncedSearchTerm, cityPage],
        enabled: citySearchOpen,
        staleTime: 5 * 60 * 1000,
        keepPreviousData: true,
      },
    }
  );

  // Handle search results with proper reset logic
  useEffect(() => {
    // If search term changed, reset pagination and cities
    if (debouncedSearchTerm !== prevSearchTermRef.current) {
      prevSearchTermRef.current = debouncedSearchTerm;
      setCityPage(0);
      setAllCities(citiesResponse && Array.isArray(citiesResponse) ? citiesResponse : []);
    } else if (citiesResponse && Array.isArray(citiesResponse)) {
      // Same search term, accumulate results for pagination
      if (cityPage === 0) {
        setAllCities(citiesResponse);
      } else {
        setAllCities((prev) => [...prev, ...citiesResponse]);
      }
    }
  }, [citiesResponse, debouncedSearchTerm, cityPage]);

  // Infinite scroll observer
  useEffect(() => {
    if (!observerTarget.current || !citySearchOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isLoadingCities &&
          !isFetching &&
          citiesResponse &&
          citiesResponse.length === 50
        ) {
          setCityPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(observerTarget.current);

    return () => {
      observer.disconnect();
    };
  }, [citySearchOpen, isLoadingCities, isFetching, citiesResponse]);

  const { mutate: createArea, isPending } = useCreateArea({
    mutation: {
      onSuccess: (data) => {
        toast.success('Location created successfully!');

        // Invalidate geography search cache
        queryClient.invalidateQueries({ queryKey: ['searchGeography'] });
        queryClient.invalidateQueries({ queryKey: ['areas'] });

        form.reset();
        onOpenChange(false);

        if (onSuccess) {
          onSuccess(data);
        }
      },
      onError: (error: any) => {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to create location';
        toast.error(errorMessage);
      },
    },
  });

  const onSubmit = (data: AreaCreationFormData) => {
    createArea({
      data: {
        name: data.name,
        pincode: data.pincode,
        status: data.status,
        city: {
          id: data.cityId,
        },
      },
    });
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      form.reset();
      setCitySearchOpen(false);
      setCitySearchTerm('');
      setCityPage(0);
      setAllCities([]);
    }
  };

  // Get selected city for display
  const selectedCity = useMemo(() => {
    const cityId = form.watch('cityId');
    return allCities.find((city) => city.id === cityId);
  }, [allCities, form.watch('cityId')]);

  const handleCitySearchChange = (value: string) => {
    setCitySearchTerm(value);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0">
        <div className="sticky top-0 bg-white z-10 border-b px-6 py-4">
          <SheetHeader>
            <SheetTitle>Create New Location</SheetTitle>
            <SheetDescription>
              Add a new area to the system. Fill in the required information below.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="px-6 py-6">
          <Form {...form}>
            <form
              id="area-creation-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
            >
              {/* Location Details Section */}
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-sm font-medium text-gray-900">Location Details</h3>
                  <p className="text-xs text-gray-500 mt-1">Basic area information</p>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Area Name
                        <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter area name"
                          {...field}
                          disabled={isPending}
                          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        Pincode
                        <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter 6-digit pincode"
                          maxLength={6}
                          {...field}
                          disabled={isPending}
                          className="transition-all duration-200 focus:ring-2 focus:ring-blue-500/20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* City Selection Section */}
              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-sm font-medium text-gray-900">City Selection</h3>
                  <p className="text-xs text-gray-500 mt-1">Select the city for this area</p>
                </div>

                <FormField
                  control={form.control}
                  name="cityId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-sm font-medium">
                        City
                        <span className="text-red-500 ml-1">*</span>
                      </FormLabel>
                      <Popover open={citySearchOpen} onOpenChange={setCitySearchOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={citySearchOpen}
                              className={cn(
                                "w-full justify-between font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={isPending}
                            >
                              {selectedCity ? (
                                <span className="truncate">
                                  {selectedCity.name}
                                  {selectedCity.district?.name &&
                                    ` (${selectedCity.district.name}, ${selectedCity.district.state?.name || ''})`
                                  }
                                </span>
                              ) : (
                                "Search and select a city"
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Type to search cities..."
                              value={citySearchTerm}
                              onValueChange={handleCitySearchChange}
                            />
                            <ScrollArea className="h-[300px]">
                              <CommandList>
                                {isLoadingCities && cityPage === 0 ? (
                                  <div className="p-4 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                    <p className="text-sm text-muted-foreground mt-2">Searching...</p>
                                  </div>
                                ) : allCities.length === 0 ? (
                                  <CommandEmpty>
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                      {citySearchTerm ? `No cities found matching "${citySearchTerm}"` : 'No cities available'}
                                    </div>
                                  </CommandEmpty>
                                ) : (
                                  <>
                                    <CommandGroup>
                                      {allCities.map((city) => (
                                        <CommandItem
                                          key={city.id}
                                          value={String(city.id)}
                                          onSelect={() => {
                                            form.setValue('cityId', city.id!);
                                            setCitySearchOpen(false);
                                            setCitySearchTerm('');
                                            setCityPage(0);
                                            setAllCities([]);
                                          }}
                                        >
                                          <Check
                                            className={cn(
                                              "mr-2 h-4 w-4 flex-shrink-0",
                                              city.id === field.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <div className="flex flex-col flex-1 min-w-0">
                                            <span className="font-medium truncate">{city.name}</span>
                                            {city.district?.name && (
                                              <span className="text-xs text-muted-foreground truncate">
                                                {city.district.name}
                                                {city.district.state?.name && `, ${city.district.state.name}`}
                                              </span>
                                            )}
                                          </div>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                    {/* Infinite scroll trigger */}
                                    <div ref={observerTarget} className="h-4 w-full">
                                      {isFetching && cityPage > 0 && (
                                        <div className="p-2 text-center">
                                          <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
                                        </div>
                                      )}
                                    </div>
                                  </>
                                )}
                              </CommandList>
                            </ScrollArea>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </form>
          </Form>
        </div>

        {/* Sticky Footer */}
        <div className="sticky bottom-0 bg-white border-t px-6 py-4">
          <div className="flex gap-3 justify-end">
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
              form="area-creation-form"
              disabled={isPending}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Location
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
