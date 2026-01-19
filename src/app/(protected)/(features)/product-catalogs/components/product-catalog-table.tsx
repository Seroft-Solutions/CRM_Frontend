'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { productCatalogToast } from './product-catalog-toast';
import {
  Download,
  EyeOff,
  Settings2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useCountProductCatalogs,
  useGetAllProductCatalogs,
  useSearchProductCatalogs,
} from '@/core/api/generated/spring/endpoints/product-catalog-resource/product-catalog-resource.gen';
import { ProductCatalogTableHeader } from './table/product-catalog-table-header';
import { ProductCatalogTableRow } from './table/product-catalog-table-row';
import { ProductCatalogSearchAndFilters } from './table/product-catalog-search-filters';
import { AdvancedPagination, usePaginationState } from './table/advanced-pagination';

const tableScrollStyles = `
  .table-scroll::-webkit-scrollbar {
    height: 8px;
  }
  .table-scroll::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  .table-scroll::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 4px;
  }
  .table-scroll::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
  .table-container {
    max-width: 100%;
  }
  @media (min-width: 1024px) {
    .table-container {
      max-width: 100%;
    }
  }

  .table-scroll td {
    white-space: normal;
    word-break: break-word;
  }
`;

const ASC = 'asc';
const DESC = 'desc';
const COLUMN_VISIBILITY_KEY = 'product-catalog-table-columns';

interface ColumnConfig {
  id: string;
  label: string;
  accessor: string;
  type: 'field' | 'relationship';
  visible: boolean;
  sortable: boolean;
}

const ALL_COLUMNS: ColumnConfig[] = [
  {
    id: 'id',
    label: 'ID',
    accessor: 'id',
    type: 'field',
    visible: true,
    sortable: true,
  },
  {
    id: 'productCatalogName',
    label: 'Catalog Name',
    accessor: 'productCatalogName',
    type: 'field',
    visible: true,
    sortable: true,
  },
  {
    id: 'price',
    label: 'Price',
    accessor: 'price',
    type: 'field',
    visible: true,
    sortable: true,
  },
  {
    id: 'description',
    label: 'Description',
    accessor: 'description',
    type: 'field',
    visible: true,
    sortable: true,
  },
  {
    id: 'product',
    label: 'Product',
    accessor: 'product',
    type: 'relationship',
    visible: true,
    sortable: false,
  },
  {
    id: 'variants',
    label: 'Variants',
    accessor: 'variants',
    type: 'relationship',
    visible: true,
    sortable: false,
  },
  {
    id: 'createdBy',
    label: 'Created By',
    accessor: 'createdBy',
    type: 'field',
    visible: false,
    sortable: true,
  },
  {
    id: 'createdDate',
    label: 'Created Date',
    accessor: 'createdDate',
    type: 'field',
    visible: false,
    sortable: true,
  },
  {
    id: 'lastModifiedBy',
    label: 'Last Modified By',
    accessor: 'lastModifiedBy',
    type: 'field',
    visible: false,
    sortable: true,
  },
  {
    id: 'lastModifiedDate',
    label: 'Last Modified Date',
    accessor: 'lastModifiedDate',
    type: 'field',
    visible: false,
    sortable: true,
  },
];

export function ProductCatalogTable() {
  const { page, pageSize, handlePageChange, handlePageSizeChange, resetPagination } =
    usePaginationState(1, 10);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [sort, setSort] = useState('id');
  const [order, setOrder] = useState<typeof ASC | typeof DESC>(ASC);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [columnVisibility, setColumnVisibility] = useState<ColumnConfig[]>(ALL_COLUMNS);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(COLUMN_VISIBILITY_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setColumnVisibility(parsed);
      }
    } catch (error) {
      console.error('Failed to parse column visibility:', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  const visibleColumns = useMemo(
    () => columnVisibility.filter((column) => column.visible),
    [columnVisibility]
  );

  const buildFilterParams = () => {
    const params: Record<string, any> = {};

    if (filters.productCatalogName) {
      params['productCatalogName.contains'] = filters.productCatalogName;
    }

    if (filters.description) {
      params['description.contains'] = filters.description;
    }

    if (filters.price) {
      const priceValue = Number(filters.price);
      if (!Number.isNaN(priceValue)) {
        params['price.equals'] = priceValue;
      }
    }

    if (filters.productId) {
      const productIdValue = Number(filters.productId);
      if (!Number.isNaN(productIdValue)) {
        params['productId.equals'] = productIdValue;
      }
    }

    if (dateRange.from) {
      params['createdDate.greaterThanOrEqual'] = dateRange.from.toISOString();
    }

    if (dateRange.to) {
      params['createdDate.lessThanOrEqual'] = dateRange.to.toISOString();
    }

    return params;
  };

  const filterParams = buildFilterParams();
  const apiPage = page - 1;

  const { data, isLoading } = searchTerm
    ? useSearchProductCatalogs(
        {
          query: searchTerm,
          page: apiPage,
          size: pageSize,
          sort: [`${sort},${order}`],
          ...filterParams,
        },
        {
          query: {
            enabled: true,
            staleTime: 0,
            refetchOnWindowFocus: true,
          },
        }
      )
    : useGetAllProductCatalogs(
        {
          page: apiPage,
          size: pageSize,
          sort: [`${sort},${order}`],
          ...filterParams,
        },
        {
          query: {
            enabled: true,
            staleTime: 0,
            refetchOnWindowFocus: true,
          },
        }
      );

  const { data: countData } = useCountProductCatalogs(filterParams, {
    query: {
      enabled: true,
      staleTime: 0,
      refetchOnWindowFocus: true,
    },
  });

  const tableData = Array.isArray(data) ? data : [];
  const totalItems = typeof countData === 'number' ? countData : tableData.length;

  useEffect(() => {
    setSelectedIds([]);
  }, [page, pageSize, searchTerm]);

  const handleSort = (column: string) => {
    if (sort === column) {
      setOrder(order === ASC ? DESC : ASC);
    } else {
      setSort(column);
      setOrder(ASC);
    }
  };

  const getSortIcon = (column: string) => {
    if (sort !== column) return 'ChevronsUpDown';
    return order === ASC ? 'ChevronUp' : 'ChevronDown';
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    resetPagination();
  };

  const handleFilterChange = (column: string, value: any) => {
    setFilters((prev) => ({ ...prev, [column]: value }));
    resetPagination();
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    setDateRange(range);
    resetPagination();
  };

  const hasActiveFilters =
    Object.values(filters).some((value) => value !== undefined && value !== '') ||
    !!searchTerm ||
    !!dateRange.from ||
    !!dateRange.to;

  const handleClearAll = () => {
    setFilters({});
    setSearchTerm('');
    setDateRange({ from: undefined, to: undefined });
    resetPagination();
  };

  const isAllSelected = tableData.length > 0 && selectedIds.length === tableData.length;
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < tableData.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(tableData.map((item) => item.id!).filter(Boolean));
    }
  };

  const handleSelect = (id: number) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleExport = () => {
    if (!tableData || tableData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportColumns = visibleColumns.map((column) => column.label);
    const rows = tableData.map((item) => {
      return visibleColumns.map((column) => {
        if (column.id === 'product') {
          return item.product?.name || '';
        }
        if (column.id === 'variants') {
          return (item.variants || [])
            .map((variant) => variant.sku || variant.id)
            .filter(Boolean)
            .join(', ');
        }
        return (item as any)[column.accessor] ?? '';
      });
    });

    const csvContent = [exportColumns, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `product-catalog-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    productCatalogToast.exported('CSV');
  };

  const resetColumns = () => {
    setColumnVisibility(ALL_COLUMNS);
  };

  return (
    <div className="space-y-4">
      <style>{tableScrollStyles}</style>

      <ProductCatalogSearchAndFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFilterChange={handleFilterChange}
        dateRange={dateRange}
        onDateRangeChange={handleDateRangeChange}
        onClearAll={handleClearAll}
        hasActiveFilters={hasActiveFilters}
      />

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={handleClearAll} className="gap-2">
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Settings2 className="h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Visible Columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {columnVisibility.map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.visible}
                  onCheckedChange={(checked) =>
                    setColumnVisibility((prev) =>
                      prev.map((item) =>
                        item.id === column.id ? { ...item, visible: !!checked } : item
                      )
                    )
                  }
                >
                  <span className="flex items-center gap-2">
                    {column.visible ? null : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                    {column.label}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <div className="px-2 py-1">
                <Button variant="ghost" size="sm" onClick={resetColumns} className="w-full">
                  Reset Columns
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="table-container border rounded-lg overflow-hidden">
        <div className="table-scroll overflow-x-auto">
          <Table>
            <ProductCatalogTableHeader
              onSort={handleSort}
              getSortIcon={getSortIcon}
              filters={filters}
              onFilterChange={handleFilterChange}
              isAllSelected={isAllSelected}
              isIndeterminate={isIndeterminate}
              onSelectAll={handleSelectAll}
              visibleColumns={visibleColumns}
            />
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 2} className="text-center py-10">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 2} className="text-center py-10">
                    No product catalogs found.
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((productCatalog) => (
                  <ProductCatalogTableRow
                    key={productCatalog.id}
                    productCatalog={productCatalog}
                    isSelected={selectedIds.includes(productCatalog.id!)}
                    onSelect={handleSelect}
                    visibleColumns={visibleColumns}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AdvancedPagination
        currentPage={page}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        isLoading={isLoading}
        compact
      />
    </div>
  );
}
