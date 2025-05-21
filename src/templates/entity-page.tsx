'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import EntityLayout from './entity-layout';
import EntityTable from './entity-table';

// This is a generic entity page template
// It should be customized for each entity type

interface EntityPageProps<T> {
  // Entity metadata
  entityName: string;
  entityNamePlural: string;
  basePath: string;
  
  // API hooks
  useGetAllEntities: any;
  useDeleteEntity: any;
  
  // Columns
  columns: Array<{
    accessorKey: string;
    header: string;
    cell?: (value: any) => React.ReactNode;
    type?: 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'relationship';
    relationshipDisplayField?: string;
  }>;
  
  // Optional callbacks
  onRowClick?: (row: T) => void;
}

export default function EntityPage<T extends { id?: number | string }>({
  entityName,
  entityNamePlural,
  basePath,
  useGetAllEntities,
  useDeleteEntity,
  columns,
  onRowClick
}: EntityPageProps<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Get pagination and sorting from URL
  const page = Number(searchParams.get('page') || '0');
  const size = Number(searchParams.get('size') || '20');
  const sort = searchParams.get('sort') || 'id';
  const order = searchParams.get('order') || 'DESC';
  
  // Fetch data with pagination and sorting
  const { data, isLoading, refetch } = useGetAllEntities({
    page,
    size,
    sort: `${sort},${order}`
  });
  
  // Refresh data when params change
  useEffect(() => {
    refetch();
  }, [page, size, sort, order, refetch]);
  
  // Handle sort change
  const handleSort = (column: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (sort === column) {
      // Toggle order if same column
      params.set('order', order === 'ASC' ? 'DESC' : 'ASC');
    } else {
      // Set new sort column
      params.set('sort', column);
      params.set('order', 'ASC'); // Default to ascending
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };
  
  return (
    <EntityLayout
      title={entityNamePlural}
      entityName={entityName}
      entityNamePlural={entityNamePlural}
      basePath={basePath}
    >
      <EntityTable
        data={data || []}
        isLoading={isLoading}
        sort={sort}
        order={order}
        onSort={handleSort}
        entityName={entityName}
        basePath={basePath}
        columns={columns}
        useDeleteEntity={useDeleteEntity}
        onRowClick={onRowClick}
      />
    </EntityLayout>
  );
}
