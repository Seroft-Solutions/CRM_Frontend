'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback, useTransition } from 'react';
import Link from 'next/link';

// API and Components
import { [[hooks.getAll]], [[hooks.search]] } from '[[endpointImport]]';
import { [[entity]]Table } from './table';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { Loader2 } from 'lucide-react';

const PAGE_SIZE = 10;

export default function [[entity]]List() {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // Get URL params with defaults
  const page = Number(params.get('page') ?? 1);
  const sort = params.get('sort') ?? 'id';
  const order = params.get('order') ?? 'ASC';
  const [search, setSearch] = useState(params.get('q') ?? '');
  const debouncedSearch = useDebounce(search, 500);

  // Fetch data
  const { data, isLoading } = [[hooks.getAll]]({ 
    query: { 
      page,
      size: PAGE_SIZE,
      sort,
      order,
      q: debouncedSearch || undefined
    },
    options: {
      keepPreviousData: true
    }
  });

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
    const next = order === 'ASC' ? 'DESC' : 'ASC';
    updateUrl({ sort: col, order: next, page: '1' });
  }, [order, updateUrl]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    updateUrl({ q: value, page: '1' });
  }, [updateUrl]);

  const handlePageChange = useCallback((newPage: number) => {
    updateUrl({ page: String(newPage) });
  }, [updateUrl]);

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

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
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search [[plural]]..."
              className="pr-8"
            />
            {isPending && (
              <Loader2 className="absolute right-2 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>

        <[[entity]]Table
          data={data?.data ?? []}
          isLoading={isLoading}
          sort={sort}
          order={order}
          onSort={handleSort}
        />

        {totalPages > 1 && (
          <div className="flex justify-center mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) handlePageChange(page - 1);
                    }}
                    disabled={page === 1}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  // Show first page, last page, and pages around current page
                  const show = p === 1 || p === totalPages ||
                    (p >= page - 2 && p <= page + 2);
                  
                  if (!show) {
                    // Show ellipsis for skipped pages
                    if (p === 2 || p === totalPages - 1) {
                      return (
                        <PaginationItem key={p}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  }

                  return (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(p);
                        }}
                        isActive={p === page}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page < totalPages) handlePageChange(page + 1);
                    }}
                    disabled={page === totalPages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
