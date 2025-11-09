'use client';

import React, { useState, useCallback } from 'react';
import { Check, ChevronsUpDown, X, Loader2, Plus } from 'lucide-react';
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
import { CustomerCreateSheet } from './customer-create-sheet';
import {
  useGetAllCustomers,
  useSearchCustomers,
} from '@/core/api/generated/spring/endpoints/customer-resource/customer-resource.gen';
import type { CustomerDTO } from '@/core/api/generated/spring/schemas';

interface EnhancedCustomerRelationshipFieldProps {
  value?: number | number[];
  onValueChange: (value: number | number[] | undefined) => void;
  placeholder?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  canCreate?: boolean;
  createPermission?: string;
  onCustomerCreated?: (customerId: number) => void;
  customFilters?: Record<string, any>;
  buttonClassName?: string;
}

export function EnhancedCustomerRelationshipField({
  value,
  onValueChange,
  placeholder = 'Select customer...',
  multiple = false,
  disabled = false,
  className,
  canCreate = false,
  createPermission,
  onCustomerCreated,
  customFilters = {},
  buttonClassName = '',
}: EnhancedCustomerRelationshipFieldProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deferredSearchQuery, setDeferredSearchQuery] = useState('');
  const [createdCustomers, setCreatedCustomers] = useState<CustomerDTO[]>([]);

  const isBusinessPartner = buttonClassName.includes('bp-primary');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDeferredSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: customersResponse,
    isLoading: isLoadingCustomers,
    refetch: refetchCustomers,
  } = useGetAllCustomers({
    page: 0,
    size: 50,
    ...customFilters,
  });

  const { data: searchResponse, isLoading: isSearching } = useSearchCustomers(
    {
      query: deferredSearchQuery,
      page: 0,
      size: 50,
    },
    {
      query: {
        enabled: deferredSearchQuery.length > 1,
        queryKey: ['search-customers-enhanced', deferredSearchQuery, customFilters],
      },
    }
  );

  const availableOptions: CustomerDTO[] = React.useMemo(() => {
    const baseOptions =
      deferredSearchQuery.length > 1 && searchResponse ? searchResponse : customersResponse || [];

    const merged = [...createdCustomers];

    baseOptions.forEach((option) => {
      if (!merged.some((customer) => customer.id === option.id)) {
        merged.push(option);
      }
    });

    return merged;
  }, [customersResponse, searchResponse, deferredSearchQuery, createdCustomers]);

  const getSelectedOptions = (): CustomerDTO[] => {
    if (!multiple || !Array.isArray(value)) return [];

    const selected: CustomerDTO[] = [];
    value.forEach((id) => {
      const option = availableOptions.find((opt) => opt.id === id);
      if (option) {
        selected.push(option);
      } else {
        selected.push({
          id: id,
          customerBusinessName: `Customer #${id}`,
          mobile: '',
          status: 'ACTIVE' as any,
          state: {} as any,
          district: {} as any,
          city: {} as any,
          area: {} as any,
        });
      }
    });
    return selected;
  };

  const getSelectedOption = (): CustomerDTO | null => {
    if (multiple || Array.isArray(value)) return null;

    const option = availableOptions.find((opt) => opt.id === value);
    if (option) {
      return option;
    } else if (value) {
      return {
        id: value,
        customerBusinessName: `Customer #${value}`,
        mobile: '',
        status: 'ACTIVE' as any,
        state: {} as any,
        district: {} as any,
        city: {} as any,
        area: {} as any,
      };
    }
    return null;
  };

  const handleSelect = (optionId: number) => {
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

  const handleRemove = (optionId: number) => {
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const newValues = currentValues.filter((id) => id !== optionId);
      onValueChange(newValues.length > 0 ? newValues : undefined);
    } else {
      onValueChange(undefined);
    }
  };

  const handleCustomerCreated = useCallback(
    (customer: CustomerDTO) => {
      const customerId = customer.id!;

      setCreatedCustomers((prev) => {
        if (prev.some((existing) => existing.id === customerId)) {
          return prev.map((existing) => (existing.id === customerId ? customer : existing));
        }
        return [customer, ...prev];
      });

      if (multiple) {
        const currentValues = Array.isArray(value) ? value : [];
        onValueChange([...currentValues, customerId]);
      } else {
        onValueChange(customerId);
        setOpen(false);
      }

      setTimeout(() => {
        refetchCustomers();
      }, 100);

      setSearchQuery('');
      setDeferredSearchQuery('');

      onCustomerCreated?.(customerId);
    },
    [value, multiple, onValueChange, onCustomerCreated, refetchCustomers]
  );

  const getDisplayText = () => {
    if (multiple) {
      const selected = getSelectedOptions();
      if (selected.length === 0) return placeholder;
      if (selected.length === 1) {
        const customer = selected[0];
        return customer.customerBusinessName || `Customer #${customer.id}`;
      }
      return `${selected.length} customers selected`;
    } else {
      const selected = getSelectedOption();
      if (selected) {
        return selected.customerBusinessName || `Customer #${selected.id}`;
      }
      return placeholder;
    }
  };

  const isLoading = isLoadingCustomers || isSearching;

  return (
    <div className="space-y-2">
      {/* Multiple selection badges */}
      {multiple && Array.isArray(value) && value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {getSelectedOptions().map((option: any) => (
            <Badge key={option.id} variant="secondary" className="text-xs flex items-center gap-1">
              {option.customerBusinessName || `Customer #${option.id}`}
              {option.customerBusinessName?.startsWith('Customer #') && (
                <span className="text-green-600 text-xs">✓ New</span>
              )}
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
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className={cn(
                'flex-1 justify-between text-left font-normal',
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
                placeholder="Search customers..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="h-9"
              />
              <CommandList>
                <CommandEmpty>
                  {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading customers...
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-sm text-muted-foreground">No customers found</p>
                      {deferredSearchQuery.length > 1 && (
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
                      : value === option.id;

                    return (
                      <CommandItem
                        key={option.id}
                        value={`${option.id}-${option.customerBusinessName}`}
                        onSelect={() => handleSelect(option.id!)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{option.customerBusinessName}</div>
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

        {/* Create new customer button */}
        {canCreate && createPermission && (
          <InlinePermissionGuard requiredPermission={createPermission}>
            <CustomerCreateSheet
              onSuccess={handleCustomerCreated}
              isBusinessPartner={isBusinessPartner}
              trigger={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={cn(
                    'shrink-0',
                    buttonClassName ||
                      'bg-blue-600 border-blue-600 hover:bg-blue-500 hover:border-blue-500'
                  )}
                  title="Create new customer"
                >
                  <Plus className="h-4 w-4 text-white" />
                </Button>
              }
            />
          </InlinePermissionGuard>
        )}
      </div>
    </div>
  );
}
