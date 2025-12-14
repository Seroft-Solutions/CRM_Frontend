'use client';

import React, { useCallback, useState } from 'react';
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
import { ProductCreateSheet } from './product-create-sheet';
import {
  useGetAllProducts,
} from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';
import type { ProductDTO } from '@/core/api/generated/spring/schemas';

interface EnhancedProductRelationshipFieldProps {
  value?: number | number[];
  onValueChange: (value: number | number[] | undefined) => void;
  placeholder?: string;
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
  canCreate?: boolean;
  createPermission?: string;
  onProductCreated?: (productId: number) => void;
  customFilters?: Record<string, any>;
  buttonClassName?: string;
}

export function EnhancedProductRelationshipField({
  value,
  onValueChange,
  placeholder = 'Select product...',
  multiple = false,
  disabled = false,
  className,
  canCreate = false,
  createPermission,
  onProductCreated,
  customFilters = {},
  buttonClassName = '',
}: EnhancedProductRelationshipFieldProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deferredSearchQuery, setDeferredSearchQuery] = useState('');

  const isBusinessPartner = buttonClassName.includes('bp-primary');

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDeferredSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const {
    data: productsResponse,
    isLoading: isLoadingProducts,
    refetch: refetchProducts,
  } = useGetAllProducts({
    page: 0,
    size: 50,
    ...customFilters,
  });

  const { data: searchResponse, isLoading: isSearching } = useGetAllProducts(
    {
      'name.contains': deferredSearchQuery,
      page: 0,
      size: 50,
      ...customFilters,
    },
    {
      query: {
        enabled: deferredSearchQuery.length > 1,
        queryKey: ['search-products-enhanced', deferredSearchQuery, customFilters],
      },
    }
  );

  const availableOptions: ProductDTO[] = React.useMemo(() => {
    if (deferredSearchQuery.length > 1 && searchResponse) {
      return searchResponse;
    }
    return productsResponse || [];
  }, [productsResponse, searchResponse, deferredSearchQuery]);

  const getSelectedOptions = (): ProductDTO[] => {
    if (!multiple || !Array.isArray(value)) return [];

    const selected: ProductDTO[] = [];
    value.forEach((id) => {
      const option = availableOptions.find((opt) => opt.id === id);
      if (option) {
        selected.push(option);
      } else {
        selected.push({
          id: id,
          name: `Product #${id}`,
          code: `PROD_${id}`,
          status: 'ACTIVE' as any,
        });
      }
    });
    return selected;
  };

  const getSelectedOption = (): ProductDTO | null => {
    if (multiple || Array.isArray(value)) return null;

    const option = availableOptions.find((opt) => opt.id === value);
    if (option) {
      return option;
    } else if (value) {
      return {
        id: value,
        name: `Product #${value}`,
        code: `PROD_${value}`,
        status: 'ACTIVE' as any,
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

  const handleProductCreated = useCallback(
    (product: ProductDTO) => {
      const productId = product.id!;

      if (multiple) {
        const currentValues = Array.isArray(value) ? value : [];
        onValueChange([...currentValues, productId]);
      } else {
        onValueChange(productId);
      }

      setTimeout(() => {
        refetchProducts();
      }, 100);

      onProductCreated?.(productId);
    },
    [value, multiple, onValueChange, onProductCreated, refetchProducts]
  );

  const getDisplayText = () => {
    if (multiple) {
      const selected = getSelectedOptions();
      if (selected.length === 0) return placeholder;
      if (selected.length === 1) {
        const product = selected[0];
        return product.name || `Product #${product.id}`;
      }
      return `${selected.length} products selected`;
    } else {
      const selected = getSelectedOption();
      if (selected) {
        return selected.name || `Product #${selected.id}`;
      }
      return placeholder;
    }
  };

  const isLoading = isLoadingProducts || isSearching;

  return (
    <div className="space-y-2">
      {/* Multiple selection badges */}
      {multiple && Array.isArray(value) && value.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {getSelectedOptions().map((option) => (
            <Badge key={option.id} variant="secondary" className="text-xs flex items-center gap-1">
              {option.name || `Product #${option.id}`}
              {option.code && option.code !== `PROD_${option.id}` && (
                <span className="text-muted-foreground">({option.code})</span>
              )}
              {option.name?.startsWith('Product #') && (
                <span className="text-green-600 text-xs">✓ New</span>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => handleRemove(option.id!)}
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
                placeholder="Search products..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="h-9"
              />
              <CommandList>
                <CommandEmpty>
                  {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Loading products...
                    </div>
                  ) : (
                    <div className="text-center p-4">
                      <p className="text-sm text-muted-foreground">No products found</p>
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
                        value={`${option.id}-${option.name}`}
                        onSelect={() => handleSelect(option.id!)}
                        className="flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{option.name}</div>
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

        {/* Create new product button */}
        {canCreate && createPermission && (
          <InlinePermissionGuard requiredPermission={createPermission}>
            <ProductCreateSheet
              onSuccess={handleProductCreated}
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
                  title="Create new product"
                >
                  <Plus
                    className={`h-4 w-4 ${isBusinessPartner ? 'text-bp-foreground' : 'text-white'}`}
                  />
                </Button>
              }
            />
          </InlinePermissionGuard>
        )}
      </div>
    </div>
  );
}
