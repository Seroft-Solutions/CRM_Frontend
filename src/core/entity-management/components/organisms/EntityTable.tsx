import React from 'react';
import { EntityDataTable, EntityDataTableProps } from '../data-table';
import { useEntityManager } from '../../context';
import { BaseEntity } from '@/features/core/tanstack-query-api';
import { ColumnDef, ColumnFiltersState } from '@tanstack/react-table';
import { RowAction } from '../../types/data-table';

interface EntityTableProps<TData extends BaseEntity = any, TFilter = any> {
  columns: ColumnDef<TData, any>[];
  filterableColumns?: string[];
  searchableColumns?: string[];
  enableRowSelection?: boolean;
  enableRowClick?: boolean;
  tableProps?: Partial<EntityDataTableProps<TData, any>>;
  onRowClick?: (item: TData) => void;
  onFilterChange?: (filters: TFilter) => void;
}

/**
 * Component for displaying entity data in a table
 * Connects to EntityManager context for data access
 */
export function EntityTable<TData extends BaseEntity = any, TFilter = any>({
  columns,
  filterableColumns,
  searchableColumns,
  enableRowSelection = false,
  enableRowClick = true,
  tableProps,
  onRowClick,
  onFilterChange,
}: EntityTableProps<TData, TFilter>) {
  const {
    entityApi,
    entityStore,
    labels,
    openModal,
    canCreate,
    canUpdate,
    canDelete,
    permissions,
  } = useEntityManager<TData, TFilter>();
  
  // Define row actions
  const rowActions: RowAction<TData>[] = [
    {
      label: 'View',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-eye"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
      onClick: (item: TData) => openModal('view', item),
      permission: permissions ? { 
        feature: permissions.feature, 
        action: permissions.view || 'VIEW' 
      } : undefined,
    },
    {
      label: 'Edit',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>,
      onClick: (item: TData) => openModal('edit', item),
      permission: permissions && permissions.update ? { 
        feature: permissions.feature, 
        action: permissions.update 
      } : undefined,
      // Stop event propagation to prevent opening view modal when clicking edit
      stopPropagation: true,
    },
    {
      label: 'Delete',
      icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>,
      onClick: entityApi.delete,
      variant: 'destructive',
      permission: permissions && permissions.delete ? { 
        feature: permissions.feature, 
        action: permissions.delete 
      } : undefined,
      showConfirm: true,
      confirmTitle: labels.deleteConfirmTitle || `Delete ${labels.entityName}`,
      confirmDescription: labels.deleteConfirmDescription || `Are you sure you want to delete this ${labels.entityName.toLowerCase()}? This action cannot be undone.`,
      confirmActionLabel: 'Delete',
      // Stop event propagation to prevent opening view modal when clicking delete
      stopPropagation: true,
    },
  ];
  
  // Handle export
  const handleExport = () => {
    if (tableProps?.onExport && entityApi.items) {
      tableProps.onExport(entityApi.items);
    } else {
      // Simple CSV export if no custom export function is provided
      const data = entityApi.items || [];
      
      if (data.length === 0) {
        console.warn('No data to export');
        return;
      }
      
      // Convert to CSV
      const header = Object.keys(data[0]).join(',');
      const rows = data.map(item => 
        Object.values(item).map(value => 
          typeof value === 'string' && value.includes(',') ? `"${value}"` : value
        ).join(',')
      );
      
      const csv = [header, ...rows].join('\n');
      
      // Download file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${labels.entityNamePlural.toLowerCase().replace(/\s+/g, '_')}_export.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  // Handle filter changes and convert to TFilter type when needed
  const handleFilterChange = (filters: ColumnFiltersState) => {
    if (onFilterChange) {
      // Convert column filters to the expected filter format
      const filterObject = filters.reduce((acc, filter) => {
        acc[filter.id] = filter.value;
        return acc;
      }, {} as Record<string, any>);
      
      onFilterChange(filterObject as unknown as TFilter);
    }
  };
  
  return (
    <EntityDataTable
      columns={columns}
      data={entityApi.items}
      actions={rowActions}
      onExport={tableProps?.enableExport ? handleExport : undefined}
      onAdd={canCreate ? () => openModal('create', null) : undefined}
      addPermission={permissions && permissions.create ? {
        feature: permissions.feature,
        action: permissions.create
      } : undefined}
      filterableColumns={filterableColumns}
      searchableColumns={searchableColumns}
      enableMultiSelect={enableRowSelection}
      onRowClick={onRowClick || ((item) => openModal('view', item))}
      enableRowClick={enableRowClick}
      isLoading={entityApi.isLoading}
      title={labels.entityNamePlural}
      description={`Manage ${labels.entityNamePlural.toLowerCase()}`}
      
      // Server-side pagination
      totalItems={entityApi.pagination.totalItems}
      pageCount={entityApi.pagination.totalPages}
      currentPage={entityApi.pagination.currentPage}
      onPageChange={entityApi.onPageChange}
      onPageSizeChange={entityApi.onPageSizeChange}
      onSortingChange={entityApi.onSortChange}
      onFilterChange={handleFilterChange}
      
      // Zustand store
      store={entityStore}
      
      // Additional props
      {...tableProps}
    />
  );
}
