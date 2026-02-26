'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, Filter, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface WarehouseFilterState {
  name?: string;
  code?: string;
  address?: string;
  capacity?: string;
  organizationId?: string;
}

interface WarehouseSearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  filters: WarehouseFilterState;
  onFilterChange: (column: keyof WarehouseFilterState, value?: string) => void;
  onClearAll: () => void;
  hasActiveFilters: boolean;
  organizations: Array<{ id: number; name?: string | null }>;
}

const filterLabels: Record<keyof WarehouseFilterState, string> = {
  name: 'Name',
  code: 'Code',
  address: 'Address',
  capacity: 'Capacity',
  organizationId: 'Organization',
};

export function WarehouseSearchAndFilters({
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  onClearAll,
  hasActiveFilters,
  organizations,
}: WarehouseSearchAndFiltersProps) {
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const organizationsById = useMemo(
    () => new Map(organizations.map((organization) => [String(organization.id), organization])),
    [organizations]
  );

  const activeFiltersCount =
    Object.values(filters).filter((value) => value !== undefined && value !== '').length +
    (searchTerm ? 1 : 0);

  const removeFilter = (filterKey: keyof WarehouseFilterState) => {
    onFilterChange(filterKey, undefined);
  };

  const getFilterDisplayValue = (key: keyof WarehouseFilterState, value: string) => {
    if (key === 'organizationId') {
      return organizationsById.get(value)?.name || value;
    }

    return value;
  };

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search warehouses..."
              value={searchTerm}
              onChange={onSearchChange}
              className="pl-10"
            />
          </div>

          <DropdownMenu open={showFilterDropdown} onOpenChange={setShowFilterDropdown}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-[20px] text-xs">
                    {activeFiltersCount}
                  </Badge>
                )}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <DropdownMenuLabel className="px-0 text-sm font-medium">
                  Filter Fields
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="space-y-2">
                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Name</label>
                    <Input
                      placeholder="Filter by name..."
                      value={filters.name || ''}
                      onChange={(event) => onFilterChange('name', event.target.value || undefined)}
                      className="h-8"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Code</label>
                    <Input
                      placeholder="Filter by code..."
                      value={filters.code || ''}
                      onChange={(event) => onFilterChange('code', event.target.value || undefined)}
                      className="h-8"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Address</label>
                    <Input
                      placeholder="Filter by address..."
                      value={filters.address || ''}
                      onChange={(event) =>
                        onFilterChange('address', event.target.value || undefined)
                      }
                      className="h-8"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Capacity</label>
                    <Input
                      type="number"
                      min={0}
                      placeholder="Filter by exact capacity..."
                      value={filters.capacity || ''}
                      onChange={(event) =>
                        onFilterChange('capacity', event.target.value || undefined)
                      }
                      className="h-8"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-muted-foreground">Organization</label>
                    <Select
                      value={filters.organizationId || 'ALL'}
                      onValueChange={(value) =>
                        onFilterChange('organizationId', value === 'ALL' ? undefined : value)
                      }
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="All organizations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">All organizations</SelectItem>
                        {organizations.map((organization) => (
                          <SelectItem key={organization.id} value={String(organization.id)}>
                            {organization.name || `Organization #${organization.id}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {searchTerm && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchTerm}
              <button
                onClick={() =>
                  onSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)
                }
                className="ml-1 rounded-full hover:bg-secondary-foreground/20"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {Object.entries(filters).map(([key, value]) => {
            if (!value) {
              return null;
            }

            const filterKey = key as keyof WarehouseFilterState;

            return (
              <Badge key={filterKey} variant="secondary" className="gap-1">
                {filterLabels[filterKey]}: {getFilterDisplayValue(filterKey, value)}
                <button
                  onClick={() => removeFilter(filterKey)}
                  className="ml-1 rounded-full hover:bg-secondary-foreground/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </>
  );
}
