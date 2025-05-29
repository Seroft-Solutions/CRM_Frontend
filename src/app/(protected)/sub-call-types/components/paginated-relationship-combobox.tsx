"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useInfiniteQuery } from "@tanstack/react-query";

interface PaginatedRelationshipComboboxProps {
  value?: number | number[];
  onValueChange: (value: number | number[] | undefined) => void;
  displayField: string;
  placeholder?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  // Hook configuration
  useInfiniteQueryHook: (params: any, options?: any) => any;
  searchHook?: (params: any, options?: any) => any;
  entityName: string;
  searchField?: string;
}

export function PaginatedRelationshipCombobox({
  value,
  onValueChange,
  displayField = "name",
  placeholder = "Select option...",
  multiple = false,
  disabled = false,
  className,
  useInfiniteQueryHook,
  searchHook,
  entityName,
  searchField = "name",
}: PaginatedRelationshipComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [deferredSearchQuery, setDeferredSearchQuery] = React.useState("");

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDeferredSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Use search if available and there's a search query, otherwise use infinite query
  const shouldUseSearch = searchHook && deferredSearchQuery.trim() !== "";

  // Reset infinite query when switching to search mode
  React.useEffect(() => {
    if (shouldUseSearch && infiniteQuery.data?.pages?.length) {
      // We're switching to search mode, but this is handled by the enabled flags
      // The data will naturally be separated by the shouldUseSearch condition
    }
  }, [shouldUseSearch]);
  
  // Infinite query for initial load and pagination
  const infiniteQuery = useInfiniteQueryHook(
    shouldUseSearch ? undefined : { size: 20 }, // Don't pass params if using search
    {
      query: {
        enabled: !shouldUseSearch,
        getNextPageParam: (lastPage: any, allPages: any[]) => {
          // Handle both array response and paginated response
          let lastPageItems = [];
          if (Array.isArray(lastPage)) {
            lastPageItems = lastPage;
          } else if (lastPage?.content && Array.isArray(lastPage.content)) {
            lastPageItems = lastPage.content;
          }
          
          const pageSize = 20;
          
          // If last page has fewer items than page size, we've reached the end
          if (lastPageItems.length < pageSize) {
            return undefined;
          }
          
          // Calculate next page number
          const currentPage = allPages.length - 1;
          return currentPage + 1;
        },
        staleTime: 30000,
      }
    }
  );

  // Search query for filtered results
  const searchQuery_ = searchHook ? searchHook(
    shouldUseSearch ? { 
      query: deferredSearchQuery,
      size: 50 // Show more results in search
    } : undefined, // Don't pass params if not searching
    {
      query: {
        enabled: shouldUseSearch && deferredSearchQuery.trim() !== "",
        staleTime: 10000,
      }
    }
  ) : null;

  // Get all options from either search or infinite query with deduplication
  const getAllOptions = () => {
    let rawOptions: any[] = [];
    
    if (shouldUseSearch && searchQuery_?.data) {
      // Handle both array response and paginated response for search
      const searchData = searchQuery_.data;
      if (Array.isArray(searchData)) {
        rawOptions = searchData;
      } else if (searchData?.content && Array.isArray(searchData.content)) {
        rawOptions = searchData.content;
      }
    } else if (infiniteQuery.data?.pages) {
      // Handle both array response and paginated response for infinite query
      rawOptions = infiniteQuery.data.pages.flatMap((page: any) => {
        if (Array.isArray(page)) {
          return page;
        } else if (page?.content && Array.isArray(page.content)) {
          return page.content;
        }
        return [];
      });
    }
    
    // Deduplicate by ID and filter out invalid items
    const seenIds = new Set();
    return rawOptions
      .filter(option => option && option.id && !seenIds.has(option.id) && seenIds.add(option.id))
      .filter(Boolean);
  };

  const allOptions = getAllOptions();
  const isLoading = shouldUseSearch ? searchQuery_?.isLoading : infiniteQuery.isLoading;
  const isFetchingNextPage = infiniteQuery.isFetchingNextPage;
  const hasNextPage = infiniteQuery.hasNextPage;
  const fetchNextPage = infiniteQuery.fetchNextPage;

  // Debug logging (remove in production)
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('PaginatedRelationshipCombobox Debug:', {
        entityName,
        shouldUseSearch,
        searchQuery: deferredSearchQuery,
        optionsCount: allOptions.length,
        isLoading,
        searchData: searchQuery_?.data,
        infiniteData: infiniteQuery.data?.pages?.length
      });
    }
  }, [shouldUseSearch, deferredSearchQuery, allOptions.length, isLoading]);

  // Handle single selection
  const handleSingleSelect = (optionId: number) => {
    const newValue = value === optionId ? undefined : optionId;
    onValueChange(newValue);
    setOpen(false);
  };

  // Handle multiple selection
  const handleMultipleSelect = (optionId: number) => {
    const currentValues = Array.isArray(value) ? value : [];
    const newValues = currentValues.includes(optionId)
      ? currentValues.filter((id) => id !== optionId)
      : [...currentValues, optionId];
    
    onValueChange(newValues.length > 0 ? newValues : undefined);
  };

  // Remove item from multiple selection
  const removeItem = (optionId: number) => {
    if (Array.isArray(value)) {
      const newValues = value.filter((id) => id !== optionId);
      onValueChange(newValues.length > 0 ? newValues : undefined);
    }
  };

  // Get display text for selected values
  const getDisplayText = () => {
    if (multiple) {
      if (!Array.isArray(value) || value.length === 0) {
        return placeholder;
      }
      return `${value.length} item${value.length === 1 ? '' : 's'} selected`;
    } else {
      if (typeof value !== 'number') {
        return placeholder;
      }
      const selectedOption = allOptions.find((option: any) => option.id === value);
      return selectedOption ? selectedOption[displayField] : placeholder;
    }
  };

  // Get selected options for multiple selection display
  const getSelectedOptions = () => {
    if (!multiple || !Array.isArray(value)) return [];
    return allOptions.filter((option: any) => value.includes(option.id));
  };

  // Handle scroll to load more
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop <= clientHeight * 1.2;
    
    if (isNearBottom && hasNextPage && !isFetchingNextPage && !shouldUseSearch) {
      fetchNextPage();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            <span className="truncate">{getDisplayText()}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput 
              placeholder={`Search ${entityName.toLowerCase()}...`}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList onScroll={handleScroll} className="max-h-60">
              {isLoading && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Loading...</span>
                </div>
              )}
              
              {!isLoading && allOptions.length === 0 && (
                <CommandEmpty>
                  {deferredSearchQuery ? `No ${entityName.toLowerCase()} found for "${deferredSearchQuery}".` : `No ${entityName.toLowerCase()} found.`}
                </CommandEmpty>
              )}
              
              {!isLoading && allOptions.length > 0 && (
                <CommandGroup>
                  {allOptions.map((option: any, index: number) => {
                    if (!option || !option.id || !option[displayField]) {
                      return null; // Skip invalid options
                    }
                    
                    const isSelected = multiple
                      ? Array.isArray(value) && value.includes(option.id)
                      : value === option.id;

                    // Create truly unique key and value
                    const uniqueKey = `${entityName.toLowerCase()}-item-${option.id}-${index}`;
                    const uniqueValue = `item-${option.id}`;

                    return (
                      <CommandItem
                        key={uniqueKey}
                        value={uniqueValue}
                        onSelect={() => {
                          if (multiple) {
                            handleMultipleSelect(option.id);
                          } else {
                            handleSingleSelect(option.id);
                          }
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {option[displayField]}
                      </CommandItem>
                    );
                  })}
                  
                  {/* Loading indicator for infinite scroll */}
                  {!shouldUseSearch && isFetchingNextPage && (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading more...</span>
                    </div>
                  )}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Display selected items for multiple selection */}
      {multiple && Array.isArray(value) && value.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {getSelectedOptions().map((option: any) => (
            <Badge key={option.id} variant="secondary" className="gap-1">
              {option[displayField]}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-muted-foreground hover:text-foreground"
                onClick={() => removeItem(option.id)}
                type="button"
              >
                <X className="h-3 w-3" />
                <span className="sr-only">Remove</span>
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
