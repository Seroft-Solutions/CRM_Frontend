'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  useCreateArea,
  getAreaWithFullHierarchy,
} from '@/core/api/generated/spring/endpoints/area-resource/area-resource.gen';
import { useSearchCitiesWithHierarchy } from '@/core/api/generated/spring/endpoints/city-resource/city-resource.gen';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import type { AreaDTO, CityDTO } from '@/core/api/generated/spring/schemas';
import { cn } from '@/lib/utils';

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
  const [selectedCity, setSelectedCity] = useState<CityDTO | null>(null);
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

  const debouncedSearchTerm = useDebounce(citySearchTerm, 500);

  const {
    data: citiesResponse,
    isLoading: isLoadingCities,
    isFetching,
  } = useSearchCitiesWithHierarchy(
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

  useEffect(() => {
    if (debouncedSearchTerm !== prevSearchTermRef.current) {
      prevSearchTermRef.current = debouncedSearchTerm;
      setCityPage(0);
      setAllCities(citiesResponse && Array.isArray(citiesResponse) ? citiesResponse : []);
    } else if (citiesResponse && Array.isArray(citiesResponse)) {
      if (cityPage === 0) {
        setAllCities(citiesResponse);
      } else {
        setAllCities((prev) => [...prev, ...citiesResponse]);
      }
    }
  }, [citiesResponse, debouncedSearchTerm, cityPage]);

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
      onSuccess: async (data) => {
        let areaWithHierarchy = data;

        if (data?.id) {
          try {
            areaWithHierarchy = await getAreaWithFullHierarchy(data.id);
          } catch (error) {
            console.warn('Failed to fetch full hierarchy for new area:', error);
          }
        }

        toast.success('Location created successfully!');

        queryClient.invalidateQueries({ queryKey: ['searchGeography'] });
        queryClient.invalidateQueries({ queryKey: ['areas'] });

        form.reset();
        onOpenChange(false);

        if (onSuccess) {
          onSuccess(areaWithHierarchy);
        }
      },
      onError: (error: any) => {
        const errorMessage =
          error?.response?.data?.message || error?.message || 'Failed to create location';
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
      setSelectedCity(null);
    }
  };

  const cityId = form.watch('cityId');

  useEffect(() => {
    if (!cityId) {
      setSelectedCity(null);
      return;
    }

    if (selectedCity?.id === cityId) {
      return;
    }

    const matchedCity = allCities.find((city) => city.id === cityId);
    if (matchedCity) {
      setSelectedCity(matchedCity);
    }
  }, [cityId, allCities, selectedCity?.id]);

  const handleCitySearchChange = (value: string) => {
    setCitySearchTerm(value);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto p-0 bg-slate-50">
        <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 text-white shadow-sm">
          <SheetHeader className="px-6 py-5 space-y-1">
            <SheetTitle className="text-lg font-semibold leading-tight text-white">
              Create New Location
            </SheetTitle>
            <SheetDescription className="text-sm text-blue-100">
              Capture area details and link them to the relevant city before saving.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="px-6 py-5">
          <Form {...form}>
            <form
              id="area-creation-form"
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-5"
            >
              {/* Location Details Section */}
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900">Location Details</h3>
                  <p className="text-xs text-slate-500">
                    Provide the identifying information for the new area.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-slate-700">
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
                      <FormLabel className="text-sm font-semibold text-slate-700">
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
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm space-y-4">
                <div className="space-y-1">
                  <h3 className="text-base font-semibold text-slate-900">City Connection</h3>
                  <p className="text-xs text-slate-500">
                    Link the area to the correct city to preserve the full hierarchy.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="cityId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-sm font-semibold text-slate-700">
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
                                'w-full justify-between font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                              disabled={isPending}
                            >
                              {selectedCity ? (
                                <span className="truncate">
                                  {selectedCity.name}
                                  {selectedCity.district?.name &&
                                    ` (${selectedCity.district.name}, ${selectedCity.district.state?.name || ''})`}
                                </span>
                              ) : (
                                'Search and select a city'
                              )}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[--radix-popover-trigger-width] p-0"
                          align="start"
                        >
                          <Command shouldFilter={false}>
                            <CommandInput
                              placeholder="Type to search cities..."
                              value={citySearchTerm}
                              onValueChange={handleCitySearchChange}
                            />
                            <CommandList
                              className="max-h-72 overflow-y-auto overscroll-contain pr-1"
                              onWheel={(event) => event.stopPropagation()}
                            >
                              {isLoadingCities && cityPage === 0 ? (
                                <div className="p-4 text-center">
                                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                  <p className="text-sm text-muted-foreground mt-2">Searching...</p>
                                </div>
                              ) : allCities.length === 0 ? (
                                <CommandEmpty>
                                  <div className="p-4 text-center text-sm text-muted-foreground">
                                    {citySearchTerm
                                      ? `No cities found matching "${citySearchTerm}"`
                                      : 'No cities available'}
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
                                          setSelectedCity(city);
                                          setCitySearchOpen(false);
                                          setCitySearchTerm('');
                                          setCityPage(0);
                                          setAllCities([]);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            'mr-2 h-4 w-4 flex-shrink-0',
                                            city.id === field.value ? 'opacity-100' : 'opacity-0'
                                          )}
                                        />
                                        <div className="flex flex-col flex-1 min-w-0">
                                          <span className="font-medium truncate">{city.name}</span>
                                          {city.district?.name && (
                                            <span className="text-xs text-muted-foreground truncate">
                                              {city.district.name}
                                              {city.district.state?.name &&
                                                `, ${city.district.state.name}`}
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
              form="area-creation-form"
              disabled={isPending}
              className="min-w-[140px]"
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
