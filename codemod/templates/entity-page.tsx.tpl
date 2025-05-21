'use client';

/**
 * [[entity]] List Page
 * 
 * This template handles API pagination with proper data shape handling.
 */

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useTransition } from 'react';
import Link from 'next/link';

import { useDebounce } from "@/hooks/use-debounce";
import { Loader2 } from 'lucide-react';

// API and Types
import type { GetAll[[plural]]Params } from '@/core/api/generated/schemas';
import { [[hooks.getAll]], [[hooks.del]], [[hooks.count]] } from '[[endpointImport]]';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { DataTable } from '@/components/datatable';
import { columns } from './columns';

const PAGE_SIZE = 10;

export default function [[entity]]List() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // Delete mutation
  const deleteEntity = [[hooks.del]]();

  // Delete handler for DataTable
  const handleDelete = useCallback(async (id: string | number) => {
    if (window.confirm('Are you sure you want to delete this [[entity]]?')) {
      try {
        await deleteEntity.mutateAsync({ id });
        // Refresh the list after deletion
        router.refresh();
      } catch (error) {
        console.error('Failed to delete entity:', error);
      }
    }
  }, [deleteEntity, router]);
  
  // Get URL params with defaults
  const page = Number(params.get('page') ?? 1);
  const size = Number(params.get('size') ?? PAGE_SIZE);
  const sort = params.get('sort') ?? 'id';
  const order = params.get('order') ?? 'asc';
  const [search, setSearch] = useState(params.get('q') ?? '');
  const debouncedSearch = useDebounce(search, 500);

  // Build query parameters with proper typing
  const buildQueryParams = (): GetAll[[plural]]Params => {
    const queryParams: GetAll[[plural]]Params = {
      page: page - 1, // Convert to 0-based indexing for the API
      size: size,
      sort: [`${sort},${order.toLowerCase()}`]
    };

    // Add search if provided - apply to all appropriate string fields
    if (debouncedSearch) {
      // Use first searchable field as primary search (typically "name")
      [[#fields]][[#isString]]
      queryParams['[[name]].contains'] = debouncedSearch;
      [[/isString]][[/fields]]
    }

    return queryParams;
  };

  // Fetch data and count
  const queryParams = buildQueryParams();
  const { data: apiResponse, isLoading: isLoadingData } = [[hooks.getAll]](queryParams);
  const { data: countData, isLoading: isLoadingCount } = [[hooks.count]]();

  // Handle response format detection
  const items = Array.isArray(apiResponse) ? apiResponse : apiResponse?.content || [];
  const totalItems = Array.isArray(apiResponse) 
    ? countData || items.length
    : (apiResponse?.totalElements || 0);

  const total = totalItems;
  const isLoading = isLoadingData || isLoadingCount;

  // URL updates
  const updateUrl = useCallback((updates: Record<string, string>) => {
    const newParams = new URLSearchParams(params);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    startTransition(() => {
      router.push('?' + newParams.toString());
    });
  }, [params, router]);

  // Event handlers
  const handleSort = useCallback((col: string) => {
    const next = sort === col && order === 'asc' ? 'desc' : 'asc';
    updateUrl({ sort: col, order: next, page: '1' });
  }, [sort, order, updateUrl]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    updateUrl({ q: value, page: '1' });
  }, [updateUrl]);

  const handlePageChange = useCallback((newPage: number) => {
    updateUrl({ page: String(newPage) });
  }, [updateUrl]);

  const totalPages = Math.ceil(total / size);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>[[plural]]</CardTitle>
            <CardDescription>
              {total} items total
            </CardDescription>
          </div>
          <Button asChild>
            <Link href="/[[kebab]]/new">+ New [[entity]]</Link>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <DataTable 
          columns={columns} 
          data={items}
          pageCount={totalPages}
          pagination={{
            pageIndex: page - 1,
            pageSize: size,
            pageCount: totalPages,
            onPageChange: (newPage) => handlePageChange(newPage + 1)
          }}
          sorting={{
            sorting: [{ id: sort, desc: order === 'desc' }],
            onSortingChange: (sorting) => {
              if (sorting && sorting[0]) {
                handleSort(sorting[0].id);
              }
            }
          }}
          search={{
            value: search,
            onChange: handleSearch,
            placeholder: `Search [[plural]]...`,
            debounce: 500
          }}
          isLoading={isLoading}
          onDelete={handleDelete}
        />
      </CardContent>
    </Card>
  );
}
