'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Check, ChevronDown, MapPin, Search, X, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useSearchGeography } from '@/core/api/generated/spring/endpoints/area-resource/area-resource.gen';
import type { AreaDTO } from '@/core/api/generated/spring/schemas';
import { cn } from '@/lib/utils';
import { AreaCreateSheet } from '../../areas/components/area-create-sheet';

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

interface IntelligentLocationFieldProps {
  value?: AreaDTO | null;
  onChange: (value: AreaDTO | null) => void;
  onError?: (error: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function IntelligentLocationField({
  value,
  onChange,
  onError,
  placeholder = 'Search for location...',
  disabled = false,
}: IntelligentLocationFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [allAreas, setAllAreas] = useState<AreaDTO[]>([]);
  const observerTarget = useRef<HTMLDivElement>(null);

  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const {
    data: searchResults,
    isLoading: isSearching,
    isFetching,
  } = useSearchGeography(
    {
      term: debouncedSearchQuery,
      page: page,
      size: 50,
    },
    {
      query: {
        enabled: isOpen && debouncedSearchQuery.length >= 2,
        queryKey: ['searchGeography', debouncedSearchQuery, page],
        staleTime: 5 * 60 * 1000,
        keepPreviousData: true,
      },
    }
  );

  useEffect(() => {
    if (searchResults) {
      if (page === 0) {
        setAllAreas(searchResults);
      } else {
        setAllAreas((prev) => [...prev, ...searchResults]);
      }
    }
  }, [searchResults, page]);

  useEffect(() => {
    setPage(0);
    setAllAreas([]);
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

  const handleSelect = (area: AreaDTO) => {
    onChange(area);
    setSearchQuery('');
    setPage(0);
    setAllAreas([]);
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
      setAllAreas([]);
    }
  };

  const getDisplayText = (area: AreaDTO | null | undefined) => {
    if (!area) return '';

    const parts: string[] = [];

    if (area.city?.district?.state?.name) {
      parts.push(area.city.district.state.name);
    }
    if (area.city?.district?.name) {
      parts.push(area.city.district.name);
    }
    if (area.city?.name) {
      parts.push(area.city.name);
    }
    if (area.name) {
      parts.push(area.name);
    }
    if (area.pincode) {
      parts.push(`(${area.pincode})`);
    }

    return parts.join(' > ');
  };

  const displayText = getDisplayText(value);

  return (
    <div className="space-y-2">
      {/* Selected Value Display */}
      {value && (
        <div className="flex items-center gap-2 p-2 rounded-md bg-blue-50 border border-blue-200">
          <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
          <div className="flex-1 text-sm text-blue-900">{displayText}</div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 hover:bg-blue-100"
            onClick={handleClear}
            disabled={disabled}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Search Combobox */}
      <Popover open={isOpen} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between text-left font-normal"
            disabled={disabled}
          >
            <span className="flex items-center gap-2 text-muted-foreground">
              <Search className="h-4 w-4" />
              {placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Type to search by state, district, city, area or pincode... (min 2 chars)"
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
                  <p className="text-sm text-muted-foreground mt-2">Searching locations...</p>
                </div>
              ) : allAreas.length === 0 ? (
                <CommandEmpty>
                  <div className="p-4 text-center space-y-3">
                    <div className="text-sm text-muted-foreground">
                      No locations found matching "{searchQuery}"
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        setIsOpen(false);
                        setIsCreateSheetOpen(true);
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Create New Location
                    </Button>
                  </div>
                </CommandEmpty>
              ) : (
                <>
                  <CommandGroup
                    heading={`${allAreas.length} location${allAreas.length !== 1 ? 's' : ''} found`}
                  >
                    {allAreas
                      .filter((area) => area && area.id)
                      .map((area) => (
                        <CommandItem
                          key={area.id}
                          value={String(area.id)}
                          onSelect={() => handleSelect(area)}
                          className="flex items-start gap-3 p-3 cursor-pointer"
                        >
                          <Check
                            className={cn(
                              'mt-1 h-4 w-4 flex-shrink-0',
                              value?.id === area.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <div className="flex-1 space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs font-medium">
                                {area.name}
                              </Badge>
                              {area.pincode && (
                                <Badge variant="secondary" className="text-xs">
                                  {area.pincode}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {getDisplayText(area)}
                            </div>
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

      {/* Validation Message */}
      {!value && <p className="text-sm text-red-500">Please select a location</p>}

      {/* Area Create Sheet */}
      <AreaCreateSheet
        isOpen={isCreateSheetOpen}
        onOpenChange={setIsCreateSheetOpen}
        onSuccess={(newArea) => {
          onChange(newArea);
          setSearchQuery('');
        }}
      />
    </div>
  );
}
