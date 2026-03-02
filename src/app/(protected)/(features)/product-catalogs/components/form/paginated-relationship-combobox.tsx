'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2, Plus, X } from 'lucide-react';
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
import { InlinePermissionGuard } from '@/core/auth';
import { useCrossFormNavigation } from '@/context/cross-form-navigation';

interface PaginatedRelationshipComboboxProps {
  value?: number | string | number[] | string[];
  onValueChange: (value: number | string | number[] | string[] | undefined) => void;
  displayField: string;
  placeholder?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  getOptionLabel?: (option: any) => string;
  useGetAllHook: (params: any, options?: any) => any;
  useSearchHook?: (params: any, options?: any) => any;
  useCountHook?: (params: any, options?: any) => any;
  entityName: string;
  searchField?: string;
  canCreate?: boolean;
  createEntityPath?: string;
  createPermission?: string;
  onEntityCreated?: (entityId: number | string) => void;
  parentFilter?: number | string;
  parentField?: string;
  customFilters?: Record<string, any>;
  onDataLoaded?: (data: any[]) => void;

  referrerForm?: string;
  referrerSessionId?: string;
  referrerField?: string;
}

export function PaginatedRelationshipCombobox({
  value,
  onValueChange,
  displayField = 'name',
  placeholder = 'Select option...',
  multiple = false,
  disabled = false,
  className,
  getOptionLabel,
  useGetAllHook,
  useSearchHook,
  useCountHook,
  entityName,
  searchField = 'name',
  canCreate = false,
  createEntityPath,
  createPermission,
  onEntityCreated,
  parentFilter,
  parentField,
  customFilters,
  onDataLoaded,
  referrerForm,
  referrerSessionId,
  referrerField,
}: PaginatedRelationshipComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [deferredSearchQuery, setDeferredSearchQuery] = React.useState('');
  const [currentPage, setCurrentPage] = React.useState(0);
  const [allLoadedData, setAllLoadedData] = React.useState<any[]>([]);
  const [hasMorePages, setHasMorePages] = React.useState(true);
  const pageSize = 20;

  const { navigateWithDraftCheck } = useCrossFormNavigation();

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDeferredSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isQueryEnabled = React.useMemo(() => {
    if (disabled) return false;
    if (parentField && !parentFilter) return false;
    return true;
  }, [disabled, parentField, parentFilter]);

  const buildFilterParams = React.useCallback(
    (pageParam: number, searchTerm: string) => {
      const params: any = {
        page: pageParam,
        size: pageSize,
        sort: [`${displayField},asc`],
      };

      if (parentFilter && parentField) {
        params[`${parentField}Id.equals`] = parentFilter;
      }

      if (searchTerm && searchTerm.trim() !== '') {
        params[`${searchField}.contains`] = searchTerm;
      }

      if (customFilters) {
        Object.keys(customFilters).forEach((key) => {
          params[key] = customFilters[key];
        });
      }

      return params;
    },
    [displayField, parentFilter, parentField, searchField, pageSize, customFilters]
  );

  const currentParams = buildFilterParams(currentPage, deferredSearchQuery);

  const {
    data: currentData,
    isLoading,
    isError,
  } = useGetAllHook(currentParams, {
    query: {
      enabled: isQueryEnabled,
      keepPreviousData: false,
    },
  });

  React.useEffect(() => {
    setCurrentPage(0);
    setAllLoadedData([]);
    setHasMorePages(true);
  }, [deferredSearchQuery, parentFilter]);

  React.useEffect(() => {
    if (currentData && !isLoading && isQueryEnabled) {
      const dataArray = Array.isArray(currentData)
        ? currentData
        : currentData.content
          ? currentData.content
          : currentData.data
            ? currentData.data
            : [];

      if (currentPage === 0) {
        setAllLoadedData(dataArray);
      } else {
        setAllLoadedData((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const newItems = dataArray.filter((item: any) => !existingIds.has(item.id));
          return [...prev, ...newItems];
        });
      }
      setHasMorePages(dataArray.length === pageSize);
    }
  }, [currentData, isLoading, currentPage, isQueryEnabled]);

  React.useEffect(() => {
    if (onDataLoaded && allLoadedData.length > 0) {
      onDataLoaded(allLoadedData);
    }
  }, [allLoadedData, onDataLoaded]);

  const loadNextPage = React.useCallback(() => {
    if (hasMorePages && !isLoading && isQueryEnabled) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [hasMorePages, isLoading, isQueryEnabled]);

  const handleScroll = React.useCallback(
    (e: React.UIEvent) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      if (scrollPercentage > 0.8 && hasMorePages && !isLoading) {
        loadNextPage();
      }
    },
    [hasMorePages, isLoading, loadNextPage]
  );

  const handleSingleSelect = (optionId: number | string) => {
    const newValue = value === optionId ? undefined : optionId;
    onValueChange(newValue);
    setOpen(false);
  };

  const handleMultipleSelect = (optionId: number | string) => {
    const currentValues = Array.isArray(value) ? value : [];
    const newValues = currentValues.includes(optionId)
      ? currentValues.filter((id) => id !== optionId)
      : [...currentValues, optionId];

    onValueChange(newValues.length > 0 ? newValues : undefined);
  };

  const removeItem = (optionId: number | string) => {
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
      if (typeof value !== 'number' && typeof value !== 'string') {
        return placeholder;
      }
      const selectedOption = allLoadedData.find((option: any) => option.id === value);
      if (!selectedOption) {
        return placeholder;
      }
      return getOptionLabel ? getOptionLabel(selectedOption) : selectedOption[displayField];
    }
  };

  const getSelectedOptions = () => {
    if (!multiple || !Array.isArray(value)) return [];
    return allLoadedData.filter((option: any) => value.includes(option.id));
  };
  const handleCreateNew = () => {
    if (createEntityPath && referrerForm && referrerSessionId && referrerField) {
      navigateWithDraftCheck({
        entityPath: createEntityPath,
        referrerForm,
        referrerSessionId,
        referrerField,
        referrerUrl: window.location.href,
      });
    } else {
      console.warn('Cross-form navigation props not provided, falling back to old navigation');

      const currentUrl = window.location.href;
      const currentPath = window.location.pathname;

      const pathParts = currentPath.split('/').filter(Boolean);
      let originEntityName = 'Previous Page';
      let sourceEntityType = '';

      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        if (lastPart === 'new') {
          const originPart = pathParts[pathParts.length - 3];
          if (originPart) {
            sourceEntityType = originPart.replace(/-/g, '');
            originEntityName = originPart
              .replace(/-/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase());
          }
        } else {
          const originPart = pathParts[pathParts.length - 2];
          if (originPart) {
            sourceEntityType = originPart.replace(/-/g, '');
            originEntityName = originPart
              .replace(/-/g, ' ')
              .replace(/\b\w/g, (l) => l.toUpperCase());
          }
        }
      }

      const sourceEntityClass = sourceEntityType
        .replace(/s$/, '')
        .replace(/\b\w/g, (l) => l.toUpperCase());

      localStorage.setItem('returnUrl', currentUrl);
      localStorage.setItem(
        'relationshipFieldInfo',
        JSON.stringify({
          entityName,
          displayField,
          multiple,
          timestamp: Date.now(),
        })
      );

      localStorage.setItem(
        'entityCreationContext',
        JSON.stringify({
          originRoute: currentPath,
          originEntityName,
          targetEntityName: entityName.replace(/s$/, ''),
          sourceEntity: sourceEntityClass,
          createdFrom: 'relationship',
        })
      );

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
    if (typeof window === 'undefined') return;

    const newEntityId = sessionStorage.getItem('newlyCreatedEntityId');
    const relationshipInfo = sessionStorage.getItem('relationshipFieldInfo');

    if (newEntityId && relationshipInfo && onEntityCreated) {
      try {
        const info = JSON.parse(relationshipInfo);
        if (info.entityName === entityName) {
          const entityId = isNaN(Number(newEntityId)) ? newEntityId : parseInt(newEntityId);
          onEntityCreated(entityId);
          sessionStorage.removeItem('newlyCreatedEntityId');
          sessionStorage.removeItem('relationshipFieldInfo');
          sessionStorage.removeItem('returnUrl');
        }
      } catch (error) {
        console.error('Error processing newly created entity:', error);
      }
    }
  }, [entityName, onEntityCreated]);

  const getDisabledMessage = () => {
    if (parentField && !parentFilter) {
      return `Select ${parentField} first`;
    }
    return placeholder;
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex gap-2">
        <div className="flex-1">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
                disabled={disabled || !isQueryEnabled}
              >
                <span className="truncate">
                  {disabled || !isQueryEnabled ? getDisabledMessage() : getDisplayText()}
                </span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder={`Search ${entityName.toLowerCase()}...`}
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  disabled={!isQueryEnabled}
                />
                <CommandList className="max-h-60 overflow-y-auto" onScroll={handleScroll}>
                  {!isQueryEnabled && (
                    <div className="flex items-center justify-center p-4 text-muted-foreground">
                      <span className="text-sm">
                        {parentField && !parentFilter
                          ? `Please select ${parentField} first`
                          : 'Search disabled'}
                      </span>
                    </div>
                  )}

                  {isQueryEnabled && isLoading && allLoadedData.length === 0 && (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2">Loading...</span>
                    </div>
                  )}

                  {isQueryEnabled && !isLoading && allLoadedData.length === 0 && !isError && (
                    <CommandEmpty>
                      {deferredSearchQuery
                        ? `No ${entityName.toLowerCase()} found for "${deferredSearchQuery}".`
                        : `No ${entityName.toLowerCase()} found.`}
                    </CommandEmpty>
                  )}

                  {isError && (
                    <div className="flex items-center justify-center p-4 text-destructive">
                      <span className="text-sm">Error loading data. Please try again.</span>
                    </div>
                  )}

                  {isQueryEnabled && allLoadedData.length > 0 && (
                    <CommandGroup>
                      {allLoadedData.map((option: any, index: number) => {
                        const optionLabel = option
                          ? getOptionLabel
                            ? getOptionLabel(option)
                            : option[displayField]
                          : '';

                        if (!option || !option.id || !optionLabel) {
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
                                'mr-2 h-4 w-4',
                                isSelected ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            {optionLabel}
                          </CommandItem>
                        );
                      })}

                      {/* Loading indicator for infinite scroll */}
                      {isLoading && allLoadedData.length > 0 && (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          <span className="ml-2 text-xs text-muted-foreground">
                            Loading more...
                          </span>
                        </div>
                      )}

                      {/* End of results indicator */}
                      {!hasMorePages && allLoadedData.length > pageSize && (
                        <div className="flex items-center justify-center p-2">
                          <span className="text-xs text-muted-foreground">
                            All {allLoadedData.length} results loaded
                          </span>
                        </div>
                      )}
                    </CommandGroup>
                  )}
                </CommandList>
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
              disabled={disabled}
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
              {getOptionLabel ? getOptionLabel(option) : option[displayField]}
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
