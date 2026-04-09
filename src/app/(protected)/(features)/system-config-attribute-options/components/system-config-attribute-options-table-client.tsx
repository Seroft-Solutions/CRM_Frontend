'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InlinePermissionGuard } from '@/core/auth';
import { Eye, Loader2, Plus, Settings } from 'lucide-react';
import { useGetAllSystemConfigAttributeOptions } from '@/core/api/generated/spring/endpoints/system-config-attribute-option-resource/system-config-attribute-option-resource.gen';
import type { SystemConfigAttributeOptionDTO } from '@/core/api/generated/spring/schemas';
import { SystemConfigAttributeOptionDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeOptionDTOStatus';

type GroupedAttributeOptions = {
  id: number;
  path: string;
  optionValues: string;
  optionCodes: string;
  options: SystemConfigAttributeOptionDTO[];
  statuses: SystemConfigAttributeOptionDTOStatus[];
};

function transformEnumValue(enumValue: string): string {
  if (!enumValue || typeof enumValue !== 'string') return enumValue;

  return enumValue
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function getStatusBadgeVariant(
  status: SystemConfigAttributeOptionDTOStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === SystemConfigAttributeOptionDTOStatus.ACTIVE) return 'default';
  if (status === SystemConfigAttributeOptionDTOStatus.ARCHIVED) return 'destructive';
  if (status === SystemConfigAttributeOptionDTOStatus.INACTIVE) return 'outline';

  return 'secondary';
}

function buildAttributePath(option: SystemConfigAttributeOptionDTO) {
  const systemConfigKey = option.attribute?.systemConfig?.configKey ?? 'unknown';
  const attributeName = option.attribute?.name ?? option.attribute?.label ?? 'attribute';

  return `${systemConfigKey}.${attributeName}`;
}

export function SystemConfigAttributeOptionsTableClient() {
  const {
    data: options = [],
    isLoading,
    error,
    refetch,
  } = useGetAllSystemConfigAttributeOptions(
    {
      page: 0,
      size: 5000,
      sort: ['attributeId,asc', 'sortOrder,asc', 'id,asc'],
    },
    {
      query: {
        staleTime: 60_000,
      },
    }
  );

  const groupedRows = useMemo<GroupedAttributeOptions[]>(() => {
    const groups = new Map<number, GroupedAttributeOptions>();

    options.forEach((option) => {
      const attributeId = option.attribute?.id;

      if (typeof attributeId !== 'number') {
        return;
      }

      const existing = groups.get(attributeId) ?? {
        id: attributeId,
        path: buildAttributePath(option),
        optionValues: '',
        optionCodes: '',
        options: [],
        statuses: [],
      };

      existing.options.push(option);
      groups.set(attributeId, existing);
    });

    return Array.from(groups.values())
      .map((group) => {
        const sortedOptions = [...group.options].sort(
          (left, right) =>
            (left.sortOrder ?? Number.MAX_SAFE_INTEGER) -
              (right.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
            (left.id ?? Number.MAX_SAFE_INTEGER) - (right.id ?? Number.MAX_SAFE_INTEGER)
        );

        return {
          ...group,
          options: sortedOptions,
          optionValues: sortedOptions.map((option) => option.label).join(', '),
          optionCodes: sortedOptions.map((option) => option.code).join(', '),
          statuses: Array.from(new Set(sortedOptions.map((option) => option.status))),
        };
      })
      .sort((left, right) =>
        left.path.localeCompare(right.path, undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      );
  }, [options]);

  return (
    <div className="space-y-4">
      <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
              <Settings className="w-4 h-4 text-sidebar-accent-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-sidebar-foreground">
                Attribute Options
              </h1>
              <p className="text-sm text-sidebar-foreground/80">
                Manage grouped options for each attribute
              </p>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <InlinePermissionGuard requiredPermission="systemConfigAttributeOption:create">
              <Button
                asChild
                size="sm"
                className="h-10 gap-2 bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90 hover:scale-105 text-sm font-semibold px-6 shadow-md transition-all duration-200 border-2 border-sidebar-accent/20"
              >
                <Link href="/system-config-attribute-options/new">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Option</span>
                </Link>
              </Button>
            </InlinePermissionGuard>
          </div>

          <div className="flex-1"></div>
        </div>
      </div>

      <div className="rounded-md border bg-white shadow-sm">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="text-sm text-muted-foreground">
            {groupedRows.length} grouped {groupedRows.length === 1 ? 'record' : 'records'}
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex min-h-[220px] items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading grouped attribute options...
          </div>
        ) : error ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-destructive">Failed to load attribute options.</p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        ) : groupedRows.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
            No attribute options found. Create an attribute option to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">ID</TableHead>
                <TableHead>Attribute</TableHead>
                <TableHead>Values</TableHead>
                <TableHead>Codes</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[90px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedRows.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/system-config-attribute-options/${group.id}?scope=attribute`}
                      className="text-blue-600 underline transition-colors hover:text-blue-800 hover:no-underline"
                    >
                      {group.id}
                    </Link>
                  </TableCell>
                  <TableCell className="whitespace-normal break-words">{group.path}</TableCell>
                  <TableCell className="max-w-[320px] whitespace-normal break-words">
                    {group.optionValues || '-'}
                  </TableCell>
                  <TableCell className="max-w-[320px] whitespace-normal break-words">
                    {group.optionCodes || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {group.statuses.map((status) => (
                        <Badge key={`${group.id}-${status}`} variant={getStatusBadgeVariant(status)}>
                          {transformEnumValue(status)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <InlinePermissionGuard requiredPermission="systemConfigAttributeOption:read">
                      <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                        <Link href={`/system-config-attribute-options/${group.id}?scope=attribute`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View grouped attribute options</span>
                        </Link>
                      </Button>
                    </InlinePermissionGuard>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
