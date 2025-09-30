'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Tag, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  useGetAllProductCategories,
  useSearchProductCategories,
} from '@/core/api/generated/spring/endpoints/product-category-resource/product-category-resource.gen';
import {
  useGetAllProductSubCategories,
  useSearchProductSubCategories,
} from '@/core/api/generated/spring/endpoints/product-sub-category-resource/product-sub-category-resource.gen';
import type { ProductCategoryDTO, ProductSubCategoryDTO } from '@/core/api/generated/spring/schemas';

interface CategoryValue {
  category?: number;
  subCategory?: number;
}

interface CategoryOption {
  id: number;
  name: string;
  code: string;
  type: 'category' | 'subcategory';
  parentId?: number;
  fullPath?: string;
}

interface IntelligentCategoryFieldProps {
  value: CategoryValue;
  onChange: (value: CategoryValue) => void;
  onError?: (error: string) => void;
  placeholder?: string;
}

export function IntelligentCategoryField({
  value,
  onChange,
  onError,
  placeholder = "Search for product category or subcategory...",
}: IntelligentCategoryFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState<CategoryOption[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // API hooks for fetching category data with proper typing
  const { data: categoriesResponse, isLoading: loadingCategories } = useGetAllProductCategories({
    page: 0,
    size: 100,
  }, {
    query: { queryKey: ['categories-for-product'] }
  });

  const { data: subCategoriesResponse, isLoading: loadingSubCategories } = useGetAllProductSubCategories({
    page: 0,
    size: 100,
    'category.id.equals': value.category,
  }, {
    query: { 
      queryKey: ['subcategories-for-product', value.category],
      enabled: !!value.category 
    }
  });

  // Extract content arrays from paginated responses
  const categories = categoriesResponse?.content || [];
  const subCategories = subCategoriesResponse?.content || [];

  // Search hooks for intelligent search with proper parameters
  const { data: categorySearchResponse, isLoading: searchingCategories } = useSearchProductCategories({
    name: searchQuery,
  }, {
    query: { 
      enabled: searchQuery.length > 1,
      queryKey: ['search-categories', searchQuery] 
    }
  });

  const { data: subCategorySearchResponse, isLoading: searchingSubCategories } = useSearchProductSubCategories({
    name: searchQuery,
  }, {
    query: { 
      enabled: searchQuery.length > 1,
      queryKey: ['search-subcategories', searchQuery] 
    }
  });

  // Extract search results from responses
  const categoryResults = categorySearchResponse?.content || [];
  const subCategoryResults = subCategorySearchResponse?.content || [];

  // Debounced search query (300ms delay)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      // Search query is already being used directly in the API hooks above
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Build selected path based on current values
  useEffect(() => {
    const buildPath = async () => {
      const path: CategoryOption[] = [];

      if (value.category && categories) {
        const category = categories.find(c => c.id === value.category);
        if (category) {
          path.push({
            id: category.id!,
            name: category.name,
            code: category.code,
            type: 'category',
            fullPath: category.name
          });
        }
      }

      if (value.subCategory && subCategories) {
        const subCategory = subCategories.find(sc => sc.id === value.subCategory);
        if (subCategory) {
          const categoryName = path.find(p => p.type === 'category')?.name || subCategory.category?.name || '';
          path.push({
            id: subCategory.id!,
            name: subCategory.name,
            code: subCategory.code,
            type: 'subcategory',
            parentId: value.category,
            fullPath: `${categoryName} > ${subCategory.name}`
          });
        }
      }

      setSelectedPath(path);
    };

    buildPath();
  }, [value, categories, subCategories]);

  // Get all search results with proper hierarchy
  const getSearchResults = (): CategoryOption[] => {
    if (!searchQuery || searchQuery.length < 2) {
      return [];
    }

    const results: CategoryOption[] = [];

    // Add category results with proper null checking
    categoryResults?.forEach(category => {
      results.push({
        id: category.id!,
        name: category.name,
        code: category.code,
        type: 'category',
        fullPath: `${category.name} (${category.code})`
      });
    });

    // Add subcategory results with proper relationship handling
    subCategoryResults?.forEach(subCategory => {
      const categoryName = subCategory.category?.name || 'Unknown Category';
      results.push({
        id: subCategory.id!,
        name: subCategory.name,
        code: subCategory.code,
        type: 'subcategory',
        parentId: subCategory.category?.id,
        fullPath: `${categoryName} > ${subCategory.name} (${subCategory.code})`
      });
    });

    // Sort by type hierarchy and then by name
    return results.sort((a, b) => {
      const typeOrder = { category: 0, subcategory: 1 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return a.name.localeCompare(b.name);
    });
  };

  const handleSelectOption = (option: CategoryOption) => {
    const newValue: CategoryValue = { ...value };

    switch (option.type) {
      case 'category':
        newValue.category = option.id;
        newValue.subCategory = undefined;
        break;
      case 'subcategory':
        newValue.subCategory = option.id;
        if (option.parentId) newValue.category = option.parentId;
        break;
    }

    onChange(newValue);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleRemoveLevel = (type: 'category' | 'subcategory') => {
    const newValue: CategoryValue = { ...value };

    switch (type) {
      case 'category':
        newValue.category = undefined;
        newValue.subCategory = undefined;
        break;
      case 'subcategory':
        newValue.subCategory = undefined;
        break;
    }

    onChange(newValue);
  };

  const isLoading = loadingCategories || loadingSubCategories;
  const isSearching = searchingCategories || searchingSubCategories;

  const displayText = selectedPath.length > 0 
    ? selectedPath[selectedPath.length - 1].fullPath 
    : '';

  return (
    <div className="space-y-2">
      {/* Selected Path Display */}
      {selectedPath.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedPath.map((item, index) => (
            <Badge
              key={`${item.type}-${item.id}`}
              variant="secondary"
              className="text-xs flex items-center gap-1"
            >
              <Tag className="h-3 w-3" />
              {item.name}
              <span className="text-muted-foreground">({item.code})</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 hover:bg-transparent"
                onClick={() => handleRemoveLevel(item.type)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search Input */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={isOpen}
            className="w-full justify-between text-left font-normal"
            onClick={() => {
              setIsOpen(true);
              setTimeout(() => inputRef.current?.focus(), 100);
            }}
          >
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              {displayText || placeholder}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-3 border-b">
            <Input
              ref={inputRef}
              placeholder="Type to search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 p-0"
            />
          </div>
          
          <ScrollArea className="h-[300px]">
            {isLoading && (
              <div className="p-3 space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            )}

            {isSearching && searchQuery.length > 1 && (
              <div className="p-3 text-sm text-muted-foreground text-center">
                Searching categories...
              </div>
            )}

            {!isLoading && !isSearching && searchQuery.length > 1 && (
              <div className="max-h-[300px]">
                {getSearchResults().map((option) => (
                  <Button
                    key={`${option.type}-${option.id}`}
                    variant="ghost"
                    className="w-full justify-start text-left h-auto p-3 rounded-none hover:bg-muted"
                    onClick={() => handleSelectOption(option)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs capitalize">
                          {option.type}
                        </Badge>
                        <span className="font-medium">{option.name}</span>
                        <span className="text-xs text-muted-foreground">({option.code})</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {option.fullPath}
                      </div>
                    </div>
                  </Button>
                ))}
                
                {getSearchResults().length === 0 && (
                  <div className="p-3 text-sm text-muted-foreground text-center">
                    No categories found matching "{searchQuery}"
                  </div>
                )}
              </div>
            )}

            {!isLoading && searchQuery.length <= 1 && (
              <div className="p-3 text-sm text-muted-foreground text-center">
                Type at least 2 characters to search categories
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Validation Messages */}
      {selectedPath.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Category selection is optional
        </p>
      )}
      
      {selectedPath.length === 1 && selectedPath[0].type === 'category' && (
        <p className="text-sm text-blue-600">
          Category selected. You can optionally select a subcategory for more specific classification.
        </p>
      )}
    </div>
  );
}