'use client';

import React, { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import {
  useGetAllUserProfiles,
} from '@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen';
import type { UserProfileDTO } from '@/core/api/generated/spring/schemas';

interface EnhancedUserProfileRelationshipFieldProps {
  value?: string | string[];
  onValueChange: (value: string | string[] | undefined) => void;
  placeholder?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  customFilters?: Record<string, any>;
  buttonClassName?: string;
}

export function EnhancedUserProfileRelationshipField({
  value,
  onValueChange,
  placeholder = 'Select user profile...',
  multiple = false,
  disabled = false,
  className,
  customFilters = {},
  buttonClassName = '',
}: EnhancedUserProfileRelationshipFieldProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deferredSearchQuery, setDeferredSearchQuery] = useState('');

  // Debounced search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDeferredSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Main query for user profiles with server-side filtering
  const {
    data: userProfilesResponse,
    isLoading: isLoadingUserProfiles,
    error: userProfilesError,
  } = useGetAllUserProfiles({
    page: 0,
    size: 200,
    ...customFilters,
  });

  // For search, we use client-side filtering on the full dataset for better UX
  // This avoids the restrictive AND logic of server-side search
  const searchFilteredOptions = useMemo(() => {
    if (!userProfilesResponse || deferredSearchQuery.length === 0) return userProfilesResponse || [];

    const query = deferredSearchQuery.toLowerCase();
    return (userProfilesResponse || []).filter(user =>
      user.firstName?.toLowerCase().includes(query) ||
      user.lastName?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.displayName?.toLowerCase().includes(query)
    );
  }, [userProfilesResponse, deferredSearchQuery]);

  // Available options - use client-side filtering for search
  const availableOptions = useMemo(() => {
    const isSearching = deferredSearchQuery.length > 0;
    if (isSearching) {
      // When searching, use client-side filtered results
      return searchFilteredOptions;
    }
    // When not searching, use all server results
    return userProfilesResponse || [];
  }, [userProfilesResponse, searchFilteredOptions, deferredSearchQuery]);

  // Loading and error states
  const isLoading = isLoadingUserProfiles;
  const error = userProfilesError;

  const getSelectedOptions = (): UserProfileDTO[] => {
    if (!multiple || !Array.isArray(value)) return [];

    return value
      .map((id) => availableOptions.find((opt) => opt.id === id))
      .filter((option): option is UserProfileDTO => !!option);
  };

  const getSelectedOption = (): UserProfileDTO | null => {
    if (multiple || Array.isArray(value)) return null;
    return availableOptions.find((opt) => opt.id === value) || null;
  };

  const handleSelect = (optionId: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      if (currentValues.includes(optionId)) {
        const newValues = currentValues.filter((id) => id !== optionId);
        onValueChange(newValues.length > 0 ? newValues : undefined);
      } else {
        onValueChange([...currentValues, optionId]);
      }
    } else {
      onValueChange(value === optionId ? undefined : optionId);
      setOpen(false);
    }
  };

  const handleRemove = (optionId: string) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.filter((id) => id !== optionId);
      onValueChange(newValues.length > 0 ? newValues : undefined);
    } else {
      onValueChange(undefined);
    }
  };


  const getDisplayText = () => {
    if (multiple) {
      const selected = getSelectedOptions();
      if (selected.length === 0) return placeholder;
      if (selected.length === 1) {
        const userProfile = selected[0];
        const fullName = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim();
        return fullName || userProfile.displayName || `User ${userProfile.id}`;
      }
      return `${selected.length} users selected`;
    } else {
      const selected = getSelectedOption();
      if (selected) {
        const fullName = `${selected.firstName || ''} ${selected.lastName || ''}`.trim();
        return fullName || selected.displayName || `User ${selected.id}`;
      }
      return placeholder;
    }
  };

  return (
    <div className="space-y-2">
      {/* Multiple selection badges */}
      {multiple && Array.isArray(value) && value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {getSelectedOptions().map((option) => (
            <Badge key={option.id} variant="secondary" className="text-xs flex items-center gap-1">
              {`${option.firstName || ''} ${option.lastName || ''}`.trim() || `User ${option.id}`}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => handleRemove(option.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Main selection interface */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between text-left font-normal',
              !value && 'text-muted-foreground',
              className
            )}
            disabled={disabled}
          >
            <span className="truncate">{getDisplayText()}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search by name or email..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="h-9"
            />
            <CommandList>
                <CommandEmpty>
                  {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading user profiles...
                    </div>
                  ) : error ? (
                    <div className="text-center p-4">
                      <p className="text-sm text-destructive">Error loading user profiles</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Please try again later
                      </p>
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-sm text-muted-foreground">No user profiles found</p>
                      {deferredSearchQuery.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Try a different search term
                        </p>
                      )}
                    </div>
                  )}
                </CommandEmpty>
              <CommandGroup>
                  {availableOptions.map((option) => {
                    const isSelected = multiple
                      ? Array.isArray(value) && value.includes(option.id!)
                      : value === option.id!;

                    return (
                      <CommandItem
                        key={option.id}
                        value={`${option.id}-${option.firstName}-${option.lastName}-${option.email}`}
                        onSelect={() => handleSelect(option.id!)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{`${option.firstName || ''} ${option.lastName || ''}`.trim()}</div>
                          <div className="text-sm text-muted-foreground">{option.email}</div>
                        </div>
                        {isSelected && <Check className="ml-2 h-4 w-4" />}
                      </CommandItem>
                    );
                  })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}