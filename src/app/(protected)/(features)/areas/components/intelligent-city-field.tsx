'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Loader2, MapPin, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useSearchCitiesWithHierarchy } from '@/core/api/generated/spring/endpoints/city-resource/city-resource.gen';
import type { CityDTO } from '@/core/api/generated/spring/schemas';
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

interface IntelligentCityFieldProps {
  value?: CityDTO | null;
  onChange: (value: CityDTO | null) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function IntelligentCityField({
  value,
  onChange,
  onError,
  placeholder = 'Search for city...',
  disabled = false,
}: IntelligentCityFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [allCities, setAllCities] = useState<CityDTO[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const {
    data: searchResults,
    isLoading: isSearching,
    isFetching,
  } = useSearchCitiesWithHierarchy(
    {
      term: debouncedSearchQuery,
      page: page,
      size: 50,
    },
    {
      query: {
        enabled: isOpen && debouncedSearchQuery.length >= 2,
        queryKey: ['searchCitiesWithHierarchy', debouncedSearchQuery, page],
        staleTime: 5 * 60 * 1000,
        keepPreviousData: true,
      },
    }
  );

  useEffect(() => {
    if (searchResults) {
      if (page === 0) {
        setAllCities(searchResults);
      } else {
        setAllCities((prev) => [...prev, ...searchResults]);
      }
    }
  }, [searchResults, page]);

  useEffect(() => {
    setPage(0);
    setAllCities([]);
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (!observerTarget.current || !isOpen) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !isSearching &&
          !isFetching &&
          searchResults &&
          searchResults.length === 50
        ) {
          setPage((prev) => prev + 1);
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(observerTarget.current);

    return () => {
      observer.disconnect();
    };
  }, [isOpen, isSearching, isFetching, searchResults]);

  const handleSelect = (city: CityDTO) => {
    onChange(city);
    setSearchQuery('');
    setPage(0);
    setAllCities([]);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setSearchQuery('');
      setPage(0);
      setAllCities([]);
    }
  };

  const getDisplayText = (city: CityDTO | null | undefined) => {
    if (!city) return '';

    const parts: string[] = [];

    if (city.district?.state?.name) {
      parts.push(city.district.state.name);
    }
    if (city.district?.name) {
      parts.push(city.district.name);
    }
    if (city.name) {
      parts.push(city.name);
    }

    return parts.join(', ');
  };

  const displayText = getDisplayText(value);

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={isOpen}
          className={cn(
            'w-full justify-between text-left font-normal h-10 px-3',
            !value && 'text-muted-foreground'
          )}
          disabled={disabled}
        >
          {value ? (
            <span className="flex items-center gap-2 truncate flex-1 min-w-0">
              <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="truncate text-sm">{displayText}</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Search className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm">{placeholder}</span>
            </span>
          )}
          {value ? (
            <X
              className="h-4 w-4 flex-shrink-0 opacity-50 hover:opacity-100 ml-2"
              onClick={handleClear}
            />
          ) : (
            <ChevronDown className="h-4 w-4 flex-shrink-0 opacity-50 ml-2" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Type to search by state, district, or city... (min 2 chars)"
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="border-0"
          />
          <CommandList
            className="max-h-72 overflow-y-auto overscroll-contain pr-1"
            onWheel={(event) => event.stopPropagation()}
          >
            {searchQuery.length < 2 ? (
              <CommandEmpty>
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Type at least 2 characters to search
                </div>
              </CommandEmpty>
            ) : isSearching && page === 0 ? (
              <div className="p-4 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Searching cities...</p>
              </div>
            ) : allCities.length === 0 ? (
              <CommandEmpty>
                <div className="p-4 text-center space-y-3">
                  <div className="text-sm text-muted-foreground">
                    No cities found matching "{searchQuery}"
                  </div>
                </div>
              </CommandEmpty>
            ) : (
              <>
                <CommandGroup
                  heading={`${allCities.length} cit${allCities.length !== 1 ? 'ies' : 'y'} found`}
                >
                  {allCities.map((city) => (
                    <CommandItem
                      key={city.id}
                      value={String(city.id)}
                      onSelect={() => handleSelect(city)}
                      className="flex items-start gap-3 p-3 cursor-pointer"
                    >
                      <Check
                        className={cn(
                          'mt-1 h-4 w-4 flex-shrink-0',
                          value?.id === city.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <div className="flex-1 space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs font-medium">
                            {city.name}
                          </Badge>
                        </div>
                        {city.district?.name && (
                          <div className="text-xs text-muted-foreground">
                            {city.district.state?.name && (
                              <span className="font-medium">{city.district.state.name}</span>
                            )}
                            {city.district.state?.name && city.district.name && ' > '}
                            {city.district.name && (
                              <span className="font-medium">{city.district.name}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {/* Infinite scroll trigger */}
                <div ref={observerTarget} className="h-4 w-full">
                  {isFetching && page > 0 && (
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
  );
}
