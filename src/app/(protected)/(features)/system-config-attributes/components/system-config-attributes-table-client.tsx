'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { InlinePermissionGuard } from '@/core/auth';
import {
  Eye,
  Loader2,
  Plus,
  Settings,
} from 'lucide-react';
import { useGetAllSystemConfigAttributes } from '@/core/api/generated/spring/endpoints/system-config-attribute-resource/system-config-attribute-resource.gen';
import type { SystemConfigAttributeDTO } from '@/core/api/generated/spring/schemas';
import { SystemConfigAttributeDTOStatus } from '@/core/api/generated/spring/schemas/SystemConfigAttributeDTOStatus';

type GroupedSystemConfigAttributes = {
  id: number;
  configKey: string;
  attributeKeys: string;
  values: string;
  attributes: SystemConfigAttributeDTO[];
  statuses: SystemConfigAttributeDTOStatus[];
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
  status: SystemConfigAttributeDTOStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === SystemConfigAttributeDTOStatus.ACTIVE) return 'default';
  if (status === SystemConfigAttributeDTOStatus.ARCHIVED) return 'destructive';
  if (status === SystemConfigAttributeDTOStatus.INACTIVE) return 'outline';

  return 'secondary';
}

export function SystemConfigAttributesTableClient() {
  const {
    data: attributes = [],
    isLoading,
    error,
    refetch,
  } = useGetAllSystemConfigAttributes(
    {
      page: 0,
      size: 5000,
      sort: ['systemConfigId,asc', 'sortOrder,asc', 'id,asc'],
    },
    {
      query: {
        staleTime: 60_000,
      },
    }
  );

  const groupedRows = useMemo<GroupedSystemConfigAttributes[]>(() => {
    const groups = new Map<number, GroupedSystemConfigAttributes>();

    attributes.forEach((attribute) => {
      const systemConfigId = attribute.systemConfig?.id;

      if (typeof systemConfigId !== 'number') {
        return;
      }

      const existing = groups.get(systemConfigId) ?? {
        id: systemConfigId,
        configKey: attribute.systemConfig?.configKey ?? `ID: ${systemConfigId}`,
        attributeKeys: '',
        values: '',
        attributes: [],
        statuses: [],
      };

      existing.attributes.push(attribute);
      groups.set(systemConfigId, existing);
    });

    return Array.from(groups.values())
      .map((group) => {
        const sortedAttributes = [...group.attributes].sort(
          (left, right) =>
            (left.sortOrder ?? Number.MAX_SAFE_INTEGER) -
              (right.sortOrder ?? Number.MAX_SAFE_INTEGER) ||
            (left.id ?? Number.MAX_SAFE_INTEGER) - (right.id ?? Number.MAX_SAFE_INTEGER)
        );

        return {
          ...group,
          attributes: sortedAttributes,
          attributeKeys: sortedAttributes.map((attribute) => attribute.name).join(', '),
          values: sortedAttributes.map((attribute) => attribute.label).join(', '),
          statuses: Array.from(new Set(sortedAttributes.map((attribute) => attribute.status))),
        };
      })
      .sort((left, right) =>
        left.configKey.localeCompare(right.configKey, undefined, {
          numeric: true,
          sensitivity: 'base',
        })
      );
  }, [attributes]);

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
                System Config Attributes
              </h1>
              <p className="text-sm text-sidebar-foreground/80">
                Manage grouped attributes for each system config
              </p>
            </div>
          </div>

          <div className="flex-1 flex justify-center">
            <InlinePermissionGuard requiredPermission="systemConfigAttribute:create">
              <Button
                asChild
                size="sm"
                className="h-10 gap-2 bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90 hover:scale-105 text-sm font-semibold px-6 shadow-md transition-all duration-200 border-2 border-sidebar-accent/20"
              >
                <Link href="/system-config-attributes/new">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">New Attribute</span>
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
            Loading grouped attributes...
          </div>
        ) : error ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center gap-3 px-6 text-center">
            <p className="text-sm text-destructive">Failed to load system config attributes.</p>
            <Button variant="outline" onClick={() => refetch()}>
              Try Again
            </Button>
          </div>
        ) : groupedRows.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
            No attributes found. Create a config attribute to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[90px]">ID</TableHead>
                <TableHead>System Config</TableHead>
                <TableHead>Attribute Keys</TableHead>
                <TableHead>Values</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[90px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {groupedRows.map((group) => (
                <TableRow key={group.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/system-config-attributes/${group.id}?scope=system-config`}
                      className="text-blue-600 underline transition-colors hover:text-blue-800 hover:no-underline"
                    >
                      {group.id}
                    </Link>
                  </TableCell>
                  <TableCell>{group.configKey}</TableCell>
                  <TableCell className="max-w-[320px] whitespace-normal break-words">
                    {group.attributeKeys || '-'}
                  </TableCell>
                  <TableCell className="max-w-[360px] whitespace-normal break-words">
                    {group.values || '-'}
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
                    <InlinePermissionGuard requiredPermission="systemConfigAttribute:read">
                      <Button variant="ghost" size="sm" asChild className="h-8 w-8 p-0">
                        <Link href={`/system-config-attributes/${group.id}?scope=system-config`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View grouped attributes</span>
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
