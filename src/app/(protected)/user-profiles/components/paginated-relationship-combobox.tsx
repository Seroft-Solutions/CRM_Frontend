"use client";

import * as React from "react";
import { Check, ChevronsUpDown, X, Loader2, Plus, ChevronLeft, ChevronRight } from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
import { InlinePermissionGuard } from "@/components/auth/permission-guard";

interface PaginatedRelationshipComboboxProps {
  value?: number | number[];
  onValueChange: (value: number | number[] | undefined) => void;
  displayField: string;
  placeholder?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  useGetAllHook: (params: any, options?: any) => any;
  useSearchHook?: (params: any, options?: any) => any;
  useCountHook?: (params: any, options?: any) => any;
  entityName: string;
  searchField?: string;
  canCreate?: boolean;
  createEntityPath?: string;
  createPermission?: string;
  onEntityCreated?: (entityId: number) => void;
  parentFilter?: number;
  parentField?: string;
}

export function PaginatedRelationshipCombobox({
  value,
  onValueChange,
  displayField = "name",
  placeholder = "Select option...",
  multiple = false,
  disabled = false,
  className,
  useGetAllHook,
  useSearchHook,
  useCountHook,
  entityName,
  searchField = "name",
  canCreate = false,
  createEntityPath,
  createPermission,
  onEntityCreated,
  parentFilter,
  parentField,
}: PaginatedRelationshipComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [deferredSearchQuery, setDeferredSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(0);
  const pageSize = 20;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDeferredSearchQuery(searchQuery);
      setCurrentPage(0); // Reset to first page on search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const buildQueryParams = (extraParams = {}) => {
    const params = { 
      page: currentPage, 
      size: pageSize, 
      sort: [displayField + ",asc"],
      ...extraParams 
    };
    if (parentFilter && parentField) {
      params[`${parentField}Id.equals`] = parentFilter;
    }
    return params;
  };

  const shouldUseSearch = useSearchHook && deferredSearchQuery.trim() !== "";

  React.useEffect(() => {
    setSearchQuery("");
    setDeferredSearchQuery("");
    setCurrentPage(0);
  }, [parentFilter]);

  // Main data query
  const dataQuery = shouldUseSearch 
    ? useSearchHook(
        buildQueryParams({ query: deferredSearchQuery }),
        {
          query: {
            enabled: shouldUseSearch && (!parentField || !!parentFilter),
            staleTime: 10000,
          }
        }
      )
    : useGetAllHook(
        buildQueryParams(),
        {
          query: {
            enabled: !shouldUseSearch && (!parentField || !!parentFilter),
            staleTime: 30000,
          }
        }
      );

  // Count query for pagination
  const countQuery = useCountHook && !shouldUseSearch ? useCountHook(
    (() => {
      const params = {};
      if (parentFilter && parentField) {
        params[`${parentField}Id.equals`] = parentFilter;
      }
      return params;
    })(),
    {
      query: {
        enabled: !shouldUseSearch && (!parentField || !!parentFilter),
        staleTime: 30000,
      }
    }
  ) : null;

  const allOptions = React.useMemo(() => {
    const rawOptions = dataQuery?.data || [];
    const seenIds = new Set();
    return rawOptions
      .filter(option => option && option.id && !seenIds.has(option.id) && seenIds.add(option.id))
      .filter(Boolean);
  }, [dataQuery?.data]);

  const totalCount = countQuery?.data || 0;
  const totalPages = Math.ceil(totalCount / pageSize);
  const isLoading = dataQuery?.isLoading;
  const canGoPrevious = currentPage > 0;
  const canGoNext = currentPage < totalPages - 1;

  const handleSingleSelect = (optionId: number) => {
    const newValue = value === optionId ? undefined : optionId;
    onValueChange(newValue);
    setOpen(false);
  };

  const handleMultipleSelect = (optionId: number) => {
    const currentValues = Array.isArray(value) ? value : [];
    const newValues = currentValues.includes(optionId)
      ? currentValues.filter((id) => id !== optionId)
      : [...currentValues, optionId];
    
    onValueChange(newValues.length > 0 ? newValues : undefined);
  };

  const removeItem = (optionId: number) => {
    if (Array.isArray(value)) {
      const newValues = value.filter((id) => id !== optionId);
      onValueChange(newValues.length > 0 ? newValues : undefined);
    }
  };

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

  const getSelectedOptions = () => {
    if (!multiple || !Array.isArray(value)) return [];
    return allOptions.filter((option: any) => value.includes(option.id));
  };

  const handleCreateNew = () => {
    if (createEntityPath) {
      const currentUrl = window.location.href;
      const currentPath = window.location.pathname;
      
      // Extract origin context dynamically
      const pathParts = currentPath.split('/').filter(Boolean);
      let originEntityName = 'Previous Page';
      
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart === 'new') {
          // We're on a creation page, origin is 2 parts back
          const originPart = pathParts[pathParts.length - 3];
          if (originPart) {
            originEntityName = originPart.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          }
        } else {
          // We're on edit/view page, origin is 1 part back  
          const originPart = pathParts[pathParts.length - 2];
          if (originPart) {
            originEntityName = originPart.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          }
        }
      }
      
      // Store context for navigation
      localStorage.setItem('returnUrl', currentUrl);
      localStorage.setItem('relationshipFieldInfo', JSON.stringify({
        entityName,
        displayField,
        multiple,
        timestamp: Date.now()
      }));
      
      localStorage.setItem('entityCreationContext', JSON.stringify({
        originRoute: currentPath,
        originEntityName,
        targetEntityName: entityName.replace(/s$/, ''),
        createdFrom: 'relationship'
      }));
      
      if (onEntityCreated) {
        const saveFormEvent = new CustomEvent('saveFormState');
        window.dispatchEvent(saveFormEvent);
      }
      
      setTimeout(() => {
        window.location.href = createEntityPath;
      }, 200);
    }
  };

  React.useEffect(() => {
    const newEntityId = sessionStorage.getItem('newlyCreatedEntityId');
    const relationshipInfo = sessionStorage.getItem('relationshipFieldInfo');
    
    if (newEntityId && relationshipInfo && onEntityCreated) {
      try {
        const info = JSON.parse(relationshipInfo);
        if (info.entityName === entityName) {
          onEntityCreated(parseInt(newEntityId));
          sessionStorage.removeItem('newlyCreatedEntityId');
          sessionStorage.removeItem('relationshipFieldInfo');
          sessionStorage.removeItem('returnUrl');
        }
      } catch (error) {
        console.error('Error processing newly created entity:', error);
      }
    }
  }, [entityName, onEntityCreated]);

  return (
    <div className={cn("w-full", className)}>
      <div className="flex gap-2">
        <div className="flex-1">
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
                <CommandList className="max-h-60">
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
                          return null;
                        }
                        
                        const isSelected = multiple
                          ? Array.isArray(value) && value.includes(option.id)
                          : value === option.id;

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
                    </CommandGroup>
                  )}
                </CommandList>
                
                {/* Pagination Controls */}
                {!shouldUseSearch && totalPages > 1 && (
                  <div className="flex items-center justify-between border-t p-2 text-xs text-muted-foreground">
                    <span>{totalCount} total items</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
                        disabled={!canGoPrevious}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <span className="text-xs">
                        {currentPage + 1} / {totalPages}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
                        disabled={!canGoNext}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        
        {canCreate && createEntityPath && createPermission && (
          <InlinePermissionGuard requiredPermission={createPermission}>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCreateNew}
              className="shrink-0"
              title={`Create new ${entityName.toLowerCase().slice(0, -1)}`}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </InlinePermissionGuard>
        )}
      </div>

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