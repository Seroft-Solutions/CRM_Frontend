'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Archive,
  Check,
  ChevronDown,
  Eye,
  Loader2,
  MoreVertical,
  Pencil,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { InlinePermissionGuard } from '@/core/auth';
import { ClickableId } from '@/components/clickable-id';
import type { CustomerDTO } from '@/core/api/generated/spring/schemas/CustomerDTO';
import { CustomerDTOStatus } from '@/core/api/generated/spring/schemas/CustomerDTOStatus';
import type { OrganizationUser } from '@/features/user-management/types';
import { cn } from '@/lib/utils';

function transformEnumValue(enumValue: string): string {
  if (!enumValue || typeof enumValue !== 'string') return enumValue;

  return enumValue
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface RelationshipConfig {
  name: string;
  displayName: string;
  options: Array<{ id: number; [key: string]: any }>;
  displayField: string;
  isEditable: boolean;
}

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface CustomerTableRowProps {
  customer: CustomerDTO;
  onArchive: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  isUpdatingStatus: boolean;
  statusOptions: StatusOption[];
  isSelected: boolean;
  onSelect: (id: number) => void;
  relationshipConfigs?: RelationshipConfig[];
  onRelationshipUpdate?: (
    entityId: number,
    relationshipName: string,
    newValue: number | null,
    isBulkOperation?: boolean
  ) => Promise<void>;
  updatingCells?: Set<string>;
  assigneeOptions?: OrganizationUser[];
  isAssigneeLoading?: boolean;
  onAssigneeUpdate?: (nextAssignee: string | null) => Promise<void>;
  visibleColumns: Array<{
    id: string;
    label: string;
    accessor: string;
    type: 'field' | 'relationship';
    visible: boolean;
    sortable: boolean;
  }>;
}

export function CustomerTableRow({
  customer,
  onArchive,
  onStatusChange,
  isUpdatingStatus,
  statusOptions,
  isSelected,
  onSelect,
  relationshipConfigs = [],
  onRelationshipUpdate,
  updatingCells = new Set(),
  assigneeOptions = [],
  isAssigneeLoading = false,
  onAssigneeUpdate,
  visibleColumns,
}: CustomerTableRowProps) {
  const currentStatus = customer.status;
  const statusInfo = statusOptions.find(
    (opt) => opt.value === currentStatus || opt.value.toString() === currentStatus
  );

  const getStatusBadge = (status: string) => {
    const info = statusOptions.find(
      (opt) => opt.value === status || opt.value.toString() === status
    );
    if (!info) return <Badge variant="secondary">{transformEnumValue(status)}</Badge>;

    return (
      <Badge variant="secondary" className={`${info.color} border-0 text-xs font-medium`}>
        {transformEnumValue(status)}
      </Badge>
    );
  };
  return (
    <TableRow className="hover:bg-gray-50 transition-colors">
      <TableCell className="w-10 sm:w-12 px-2 sm:px-3 py-2 sticky left-0 bg-white z-10">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => customer.id && onSelect(customer.id)}
        />
      </TableCell>
      {visibleColumns.map((column, index) => (
        <TableCell
          key={column.id}
          className={`
            px-2 sm:px-3 py-2 
            ${index === 0 ? 'min-w-[120px]' : 'min-w-[100px]'} 
            whitespace-nowrap overflow-hidden text-ellipsis
          `}
        >
          {column.type === 'field'
            ? (() => {
                const field = customer[column.accessor as keyof typeof customer];

                if (column.id === 'customerBusinessName') {
                  return field?.toString() || '';
                }

                if (column.id === 'email') {
                  return field?.toString() || '';
                }

                if (column.id === 'mobile') {
                  return field?.toString() || '';
                }

                if (column.id === 'whatsApp') {
                  return field?.toString() || '';
                }

                if (column.id === 'contactPerson') {
                  return field?.toString() || '';
                }

                if (column.id === 'status') {
                  return getStatusBadge(field as string);
                }

                if (column.id === 'assignee') {
                  return (
                    <CustomerAssigneeCell
                      customerId={customer.id ?? 0}
                      currentAssignee={customer.assignee ?? ''}
                      options={assigneeOptions}
                      isLoading={isAssigneeLoading}
                      onUpdate={onAssigneeUpdate}
                    />
                  );
                }

                if (column.id === 'completeAddress') {
                  const addresses = customer.addresses || [];
                  const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
                  const value = defaultAddr?.completeAddress;
                  return (
                    <div className="whitespace-normal min-w-[200px] max-w-[300px]">
                      {value?.toString() || '-'}
                    </div>
                  );
                }

                if (column.id === 'createdBy') {
                  return field?.toString() || '';
                }

                if (column.id === 'createdDate') {
                  return field ? format(new Date(field as string), 'PPP') : '';
                }

                if (column.id === 'lastModifiedBy') {
                  return field?.toString() || '';
                }

                if (column.id === 'lastModifiedDate') {
                  return field ? format(new Date(field as string), 'PPP') : '';
                }

                if (column.id === 'id') {
                  return <ClickableId id={field as string | number} entityType="customers" />;
                }

                if (column.id === 'defaultAddress') {
                  const addresses = customer.addresses || [];
                  const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
                  if (!defaultAddr) return '-';

                  const area = defaultAddr.area;
                  if (area) {
                    const city = (area as any).city?.name || (area as any).cityName;
                    const state =
                      (area as any).city?.district?.state?.name || (area as any).stateName;
                    const pincode = area.pincode;

                    const parts = [];
                    if (city) parts.push(city);
                    if (state) parts.push(state);
                    const cityState = parts.join(', ');
                    return cityState
                      ? `${cityState}${pincode ? ` (${pincode})` : ''}`
                      : pincode || '-';
                  }
                  return '-';
                }

                return field?.toString() || '';
              })()
            : (() => {
                return null;
              })()}
        </TableCell>
      ))}
      <TableCell className="sticky right-0 bg-white px-2 sm:px-3 py-2 border-l border-gray-200 z-10 w-[140px] sm:w-[160px]">
        <div className="flex items-center justify-center gap-0.5 sm:gap-1">
          <InlinePermissionGuard requiredPermission="customer:read">
            <Button variant="ghost" size="sm" asChild className="h-6 w-6 sm:h-7 sm:w-7 p-0">
              <Link href={`/customers/${customer.id}`}>
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="customer:update">
            <Button variant="ghost" size="sm" asChild className="h-6 w-6 sm:h-7 sm:w-7 p-0">
              <Link href={`/customers/${customer.id}/edit`}>
                <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>

          {/* Status Management Dropdown */}
          <InlinePermissionGuard requiredPermission="customer:update">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                  disabled={isUpdatingStatus}
                >
                  <MoreVertical className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  <span className="sr-only">Status Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {currentStatus !== CustomerDTOStatus.ACTIVE && (
                  <DropdownMenuItem
                    onClick={() => customer.id && onStatusChange(customer.id, 'ACTIVE')}
                    className="text-green-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Set Active
                  </DropdownMenuItem>
                )}
                {currentStatus !== CustomerDTOStatus.INACTIVE && (
                  <DropdownMenuItem
                    onClick={() => customer.id && onStatusChange(customer.id, 'INACTIVE')}
                    className="text-yellow-700"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Set Inactive
                  </DropdownMenuItem>
                )}
                {currentStatus !== CustomerDTOStatus.DRAFT && (
                  <DropdownMenuItem
                    onClick={() => customer.id && onStatusChange(customer.id, 'DRAFT')}
                    className="text-gray-700"
                  >
                    <div className="w-4 h-4 mr-2 border border-current rounded" />
                    Set Draft
                  </DropdownMenuItem>
                )}
                {currentStatus !== CustomerDTOStatus.ARCHIVED && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => customer.id && onArchive(customer.id)}
                      className="text-red-700"
                    >
                      <Archive className="w-4 h-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </InlinePermissionGuard>
        </div>
      </TableCell>
    </TableRow>
  );
}

function getOrganizationMemberAssigneeValue(user: OrganizationUser) {
  return (
    user.email ||
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.username ||
    user.id ||
    ''
  );
}

function CustomerAssigneeCell({
  customerId,
  currentAssignee,
  options,
  isLoading,
  onUpdate,
}: {
  customerId: number;
  currentAssignee: string;
  options: OrganizationUser[];
  isLoading: boolean;
  onUpdate?: (nextAssignee: string | null) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [optimisticAssignee, setOptimisticAssignee] = useState(currentAssignee);

  useEffect(() => {
    setOptimisticAssignee(currentAssignee);
  }, [currentAssignee]);

  const handleSelect = async (nextAssignee: string | null) => {
    if (updating || !onUpdate) {
      return;
    }

    const normalizedAssignee = nextAssignee ?? '';

    setUpdating(true);
    setOpen(false);
    setOptimisticAssignee(normalizedAssignee);

    try {
      await onUpdate(normalizedAssignee || null);
    } catch {
      setOptimisticAssignee(currentAssignee);
    } finally {
      setUpdating(false);
    }
  };

  const selectedAssignee = optimisticAssignee || '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          aria-label={`Update assignee for customer ${customerId}`}
          className={cn(
            'h-7 w-full justify-between px-2 py-0 text-left font-normal hover:bg-muted',
            (updating || isLoading || !onUpdate) && 'opacity-75'
          )}
          disabled={updating || isLoading || !onUpdate}
        >
          <span className="truncate text-sm font-semibold text-slate-800">
            {updating || isLoading ? (
              <span className="flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                {updating ? 'Updating...' : 'Loading...'}
              </span>
            ) : (
              selectedAssignee || 'Select...'
            )}
          </span>
          <ChevronDown
            className={cn(
              'ml-1 h-3 w-3 shrink-0 opacity-50 transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search assignee..." className="h-8" />
          <CommandList>
            <CommandEmpty>No salesman found.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="__none__" onSelect={() => handleSelect(null)}>
                <Check
                  className={cn('mr-2 h-3 w-3', !selectedAssignee ? 'opacity-100' : 'opacity-0')}
                />
                <span className="text-muted-foreground">None</span>
              </CommandItem>
              {options.map((user) => {
                const assigneeValue = getOrganizationMemberAssigneeValue(user);
                const isSelected = selectedAssignee === assigneeValue;

                if (!assigneeValue) {
                  return null;
                }

                return (
                  <CommandItem
                    key={user.id ?? assigneeValue}
                    value={assigneeValue}
                    onSelect={() => handleSelect(assigneeValue)}
                  >
                    <Check
                      className={cn('mr-2 h-3 w-3', isSelected ? 'opacity-100' : 'opacity-0')}
                    />
                    {assigneeValue}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
