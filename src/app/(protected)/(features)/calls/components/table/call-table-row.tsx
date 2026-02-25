'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Archive, Eye, MoreVertical, Pencil, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { InlinePermissionGuard } from '@/core/auth';
import { useGetCustomer } from '@/core/api/generated/spring/endpoints/customer-resource/customer-resource.gen';
import { RelationshipCell } from './relationship-cell';
import type { CallDTO } from '@/core/api/generated/spring/schemas/CallDTO';
import { CallDTOStatus } from '@/core/api/generated/spring/schemas/CallDTOStatus';

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

export type LatestRemarksMap = Record<
  number,
  {
    id?: number;
    remark: string;
    dateTime?: string;
    status?: string;
  }
>;

const REMARK_AUTOSAVE_DELAY_MS = 800;

interface EditableRemarkCellProps {
  callId?: number;
  remarkEntry?: LatestRemarksMap[number];
  isLatestRemarksLoading: boolean;
  isSaving: boolean;
  onAutoSave?: (callId: number, remark: string) => Promise<void>;
}

function EditableRemarkCell({
  callId,
  remarkEntry,
  isLatestRemarksLoading,
  isSaving,
  onAutoSave,
}: EditableRemarkCellProps) {
  const savedRemark = remarkEntry?.remark ?? '';
  const [draftRemark, setDraftRemark] = useState(savedRemark);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!isFocused) {
      setDraftRemark(savedRemark);
    }
  }, [savedRemark, isFocused]);

  useEffect(
    () => () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    },
    []
  );

  if (!callId) {
    return isLatestRemarksLoading ? (
      <span className="text-xs text-muted-foreground">Loading...</span>
    ) : (
      <span className="text-muted-foreground">--</span>
    );
  }

  if (!onAutoSave) {
    return savedRemark ? <span className="block max-w-full">{savedRemark}</span> : '--';
  }

  const saveIfChanged = async (value: string) => {
    if (isSaving) {
      return;
    }

    const normalizedCurrent = value.trim();
    const normalizedSaved = savedRemark.trim();

    if (normalizedCurrent === normalizedSaved) {
      return;
    }

    await onAutoSave(callId, normalizedCurrent);
  };

  const queueAutosave = (value: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      void saveIfChanged(value);
    }, REMARK_AUTOSAVE_DELAY_MS);
  };

  return (
    <div className="min-w-[220px] space-y-1">
      <Input
        value={draftRemark}
        placeholder={isLatestRemarksLoading && !savedRemark ? 'Loading...' : 'Add remark...'}
        onChange={(event) => {
          const nextValue = event.target.value;
          setDraftRemark(nextValue);
          queueAutosave(nextValue);
        }}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);

          if (debounceRef.current) {
            clearTimeout(debounceRef.current);
          }

          void saveIfChanged(draftRemark);
        }}
        disabled={isSaving}
        className="h-8 text-sm"
      />
      {isSaving ? <span className="text-[11px] text-muted-foreground">Saving...</span> : null}
    </div>
  );
}

interface CallTableRowProps {
  call: CallDTO;
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
  latestRemarksMap: LatestRemarksMap;
  isLatestRemarksLoading: boolean;
  remarkSavingIds?: Set<number>;
  onRemarkAutoSave?: (callId: number, remark: string) => Promise<void>;
  visibleColumns: Array<{
    id: string;
    label: string;
    accessor: string;
    type: 'field' | 'relationship' | 'custom';
    visible: boolean;
    sortable: boolean;
  }>;
  excludedAssignedToEmail?: string;
}

export function CallTableRow({
  call,
  onArchive,
  onStatusChange,
  isUpdatingStatus,
  statusOptions,
  isSelected,
  onSelect,
  relationshipConfigs = [],
  onRelationshipUpdate,
  updatingCells = new Set(),
  latestRemarksMap,
  isLatestRemarksLoading,
  remarkSavingIds = new Set(),
  onRemarkAutoSave,
  visibleColumns,
  excludedAssignedToEmail,
}: CallTableRowProps) {
  const customerId = Number(call.customer?.id);
  const shouldFetchCustomerPhone = Number.isFinite(customerId) && !call.customer?.mobile;
  const { data: customerDetails } = useGetCustomer(customerId || 0, {
    query: {
      enabled: shouldFetchCustomerPhone,
    },
  });

  const currentStatus = call.status;
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
        <Checkbox checked={isSelected} onCheckedChange={() => call.id && onSelect(call.id)} />
      </TableCell>
      {visibleColumns.map((column, index) => {
        const renderRemarksCell = () => {
          return (
            <EditableRemarkCell
              callId={call.id}
              remarkEntry={call.id ? latestRemarksMap[call.id] : undefined}
              isLatestRemarksLoading={isLatestRemarksLoading}
              isSaving={call.id ? remarkSavingIds.has(call.id) : false}
              onAutoSave={onRemarkAutoSave}
            />
          );
        };

        const renderFieldCell = () => {
          const field = call[column.accessor as keyof typeof call];

          if (column.id === 'leadNo') {
            const displayValue = field?.toString() || '';
            if (!displayValue) {
              return '';
            }

            const leadNoTag = (
              <Badge
                variant="secondary"
                className="border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
              >
                {displayValue}
              </Badge>
            );

            if (call.id) {
              return (
                <Link href={`/calls/${call.id}`} className="inline-flex">
                  {leadNoTag}
                </Link>
              );
            }

            return leadNoTag;
          }

          if (column.id === 'status') {
            return getStatusBadge(field as string);
          }

          if (column.id === 'externalId') {
            return field?.toString() || '';
          }

          if (column.id === 'createdBy') {
            return field?.toString() || '';
          }

          if (column.id === 'createdDate') {
            return field ? format(new Date(field as string), 'PPp') : '';
          }

          if (column.id === 'lastModifiedBy') {
            return field?.toString() || '';
          }

          if (column.id === 'lastModifiedDate') {
            return field ? format(new Date(field as string), 'PPp') : '';
          }

          return field?.toString() || '';
        };

        const renderRelationshipCell = () => {
          if (column.id === 'priority') {
            const cellKey = `${call.id}-priority`;
            return (
              <RelationshipCell
                entityId={call.id || 0}
                relationshipName="priority"
                currentValue={call.priority}
                options={
                  relationshipConfigs.find((config) => config.name === 'priority')?.options || []
                }
                displayField="name"
                onUpdate={(entityId, relationshipName, newValue) =>
                  onRelationshipUpdate
                    ? onRelationshipUpdate(entityId, relationshipName, newValue, false)
                    : Promise.resolve()
                }
                isEditable={
                  relationshipConfigs.find((config) => config.name === 'priority')?.isEditable ||
                  false
                }
                isLoading={updatingCells.has(cellKey)}
                className="min-w-[150px]"
                relatedEntityRoute="priorities"
                showNavigationIcon={true}
              />
            );
          }

          if (column.id === 'callType') {
            return call.callType?.name || '';
          }

          if (column.id === 'subCallType') {
            return call.subCallType?.name || '';
          }

          if (column.id === 'source') {
            const cellKey = `${call.id}-source`;
            return (
              <RelationshipCell
                entityId={call.id || 0}
                relationshipName="source"
                currentValue={call.source}
                options={
                  relationshipConfigs.find((config) => config.name === 'source')?.options || []
                }
                displayField="name"
                onUpdate={(entityId, relationshipName, newValue) =>
                  onRelationshipUpdate
                    ? onRelationshipUpdate(entityId, relationshipName, newValue, false)
                    : Promise.resolve()
                }
                isEditable={
                  relationshipConfigs.find((config) => config.name === 'source')?.isEditable ||
                  false
                }
                isLoading={updatingCells.has(cellKey)}
                className="min-w-[150px]"
                relatedEntityRoute="sources"
                showNavigationIcon={true}
              />
            );
          }

          if (column.id === 'customer') {
            const cellKey = `${call.id}-customer`;
            return (
              <RelationshipCell
                entityId={call.id || 0}
                relationshipName="customer"
                currentValue={call.customer}
                options={
                  relationshipConfigs.find((config) => config.name === 'customer')?.options || []
                }
                displayField="customerBusinessName"
                onUpdate={(entityId, relationshipName, newValue) =>
                  onRelationshipUpdate
                    ? onRelationshipUpdate(entityId, relationshipName, newValue, false)
                    : Promise.resolve()
                }
                isEditable={
                  relationshipConfigs.find((config) => config.name === 'customer')?.isEditable ||
                  false
                }
                isLoading={updatingCells.has(cellKey)}
                className="min-w-[150px]"
                relatedEntityRoute="customers"
                showNavigationIcon={true}
              />
            );
          }

          if (column.id === 'product') {
            const cellKey = `${call.id}-product`;
            return (
              <RelationshipCell
                entityId={call.id || 0}
                relationshipName="product"
                currentValue={call.product}
                options={
                  relationshipConfigs.find((config) => config.name === 'product')?.options || []
                }
                displayField="name"
                onUpdate={(entityId, relationshipName, newValue) =>
                  onRelationshipUpdate
                    ? onRelationshipUpdate(entityId, relationshipName, newValue, false)
                    : Promise.resolve()
                }
                isEditable={
                  relationshipConfigs.find((config) => config.name === 'product')?.isEditable ||
                  false
                }
                isLoading={updatingCells.has(cellKey)}
                className="min-w-[150px]"
                relatedEntityRoute="products"
                showNavigationIcon={true}
              />
            );
          }

          if (column.id === 'channelType') {
            const cellKey = `${call.id}-channelType`;
            return (
              <RelationshipCell
                entityId={call.id || 0}
                relationshipName="channelType"
                currentValue={call.channelType}
                options={
                  relationshipConfigs.find((config) => config.name === 'channelType')?.options || []
                }
                displayField="name"
                onUpdate={(entityId, relationshipName, newValue) =>
                  onRelationshipUpdate
                    ? onRelationshipUpdate(entityId, relationshipName, newValue, false)
                    : Promise.resolve()
                }
                isEditable={
                  relationshipConfigs.find((config) => config.name === 'channelType')?.isEditable ||
                  false
                }
                isLoading={updatingCells.has(cellKey)}
                className="min-w-[150px]"
                relatedEntityRoute="channel-types"
                showNavigationIcon={true}
              />
            );
          }

          if (column.id === 'channelParties') {
            const cellKey = `${call.id}-channelParties`;
            return (
              <RelationshipCell
                entityId={call.id || 0}
                relationshipName="channelParties"
                currentValue={call.channelParties}
                options={
                  relationshipConfigs.find((config) => config.name === 'channelParties')?.options ||
                  []
                }
                displayField="displayName"
                onUpdate={(entityId, relationshipName, newValue) =>
                  onRelationshipUpdate
                    ? onRelationshipUpdate(entityId, relationshipName, newValue, false)
                    : Promise.resolve()
                }
                isEditable={
                  relationshipConfigs.find((config) => config.name === 'channelParties')
                    ?.isEditable || false
                }
                isLoading={updatingCells.has(cellKey)}
                className="min-w-[150px]"
                relatedEntityRoute="user-profiles"
                showNavigationIcon={true}
              />
            );
          }

          if (column.id === 'assignedTo') {
            const cellKey = `${call.id}-assignedTo`;
            const isExcluded =
              excludedAssignedToEmail &&
              call.assignedTo?.email?.toLowerCase?.() === excludedAssignedToEmail.toLowerCase();
            const safeAssignedTo = isExcluded ? undefined : call.assignedTo;
            return (
              <RelationshipCell
                entityId={call.id || 0}
                relationshipName="assignedTo"
                currentValue={safeAssignedTo}
                options={
                  relationshipConfigs.find((config) => config.name === 'assignedTo')?.options || []
                }
                displayField="email"
                onUpdate={(entityId, relationshipName, newValue) =>
                  onRelationshipUpdate
                    ? onRelationshipUpdate(entityId, relationshipName, newValue, false)
                    : Promise.resolve()
                }
                isEditable={
                  relationshipConfigs.find((config) => config.name === 'assignedTo')?.isEditable ||
                  false
                }
                isLoading={updatingCells.has(cellKey)}
                className="min-w-[150px]"
                relatedEntityRoute="user-profiles"
                showNavigationIcon={true}
              />
            );
          }

          if (column.id === 'callStatus') {
            const cellKey = `${call.id}-callStatus`;
            return (
              <RelationshipCell
                entityId={call.id || 0}
                relationshipName="callStatus"
                currentValue={call.callStatus}
                options={
                  relationshipConfigs.find((config) => config.name === 'callStatus')?.options || []
                }
                displayField="name"
                onUpdate={(entityId, relationshipName, newValue) =>
                  onRelationshipUpdate
                    ? onRelationshipUpdate(entityId, relationshipName, newValue, false)
                    : Promise.resolve()
                }
                isEditable={
                  relationshipConfigs.find((config) => config.name === 'callStatus')?.isEditable ||
                  false
                }
                isLoading={updatingCells.has(cellKey)}
                className="min-w-[150px]"
              />
            );
          }

          return null;
        };

        const renderCellContent = () => {
          if (column.id === 'remarks') {
            return renderRemarksCell();
          }

          if (column.id === 'customerPhone') {
            const customerOptions =
              relationshipConfigs.find((config) => config.name === 'customer')?.options || [];
            const customerFromOptionsById = Number.isFinite(customerId)
              ? customerOptions.find((customer) => Number(customer?.id) === customerId)
              : undefined;
            const customerFromOptionsByName = call.customer?.customerBusinessName
              ? customerOptions.find(
                  (customer) =>
                    customer?.customerBusinessName === call.customer?.customerBusinessName
                )
              : undefined;

            return (
              call.customer?.mobile ||
              customerDetails?.mobile ||
              customerFromOptionsById?.mobile ||
              customerFromOptionsByName?.mobile ||
              ''
            );
          }

          if (column.type === 'field') {
            return renderFieldCell();
          }

          if (column.type === 'relationship') {
            return renderRelationshipCell();
          }

          return null;
        };

        return (
          <TableCell
            key={column.id}
            className={`
              px-2 sm:px-3 py-2 
              ${index === 0 ? 'min-w-[120px]' : 'min-w-[100px]'} 
              whitespace-nowrap overflow-hidden text-ellipsis
            `}
          >
            {renderCellContent()}
          </TableCell>
        );
      })}
      <TableCell className="sticky right-0 bg-white px-2 sm:px-3 py-2 border-l border-gray-200 z-10 w-[140px] sm:w-[160px]">
        <div className="flex items-center justify-center gap-0.5 sm:gap-1">
          <InlinePermissionGuard requiredPermission="call:read">
            <Button variant="ghost" size="sm" asChild className="h-6 w-6 sm:h-7 sm:w-7 p-0">
              <Link href={`/calls/${call.id}`}>
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">View</span>
              </Link>
            </Button>
          </InlinePermissionGuard>
          <InlinePermissionGuard requiredPermission="call:update">
            <Button variant="ghost" size="sm" asChild className="h-6 w-6 sm:h-7 sm:w-7 p-0">
              <Link href={`/calls/${call.id}/edit`}>
                <Pencil className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="sr-only">Edit</span>
              </Link>
            </Button>
          </InlinePermissionGuard>

          {/* Status Management Dropdown */}
          <InlinePermissionGuard requiredPermission="call:update">
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
                {currentStatus !== CallDTOStatus.ACTIVE && (
                  <DropdownMenuItem
                    onClick={() => call.id && onStatusChange(call.id, 'ACTIVE')}
                    className="text-green-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Set Active
                  </DropdownMenuItem>
                )}
                {currentStatus !== CallDTOStatus.INACTIVE && (
                  <DropdownMenuItem
                    onClick={() => call.id && onStatusChange(call.id, 'INACTIVE')}
                    className="text-yellow-700"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Set Inactive
                  </DropdownMenuItem>
                )}
                {currentStatus !== CallDTOStatus.DRAFT && (
                  <DropdownMenuItem
                    onClick={() => call.id && onStatusChange(call.id, 'DRAFT')}
                    className="text-gray-700"
                  >
                    <div className="w-4 h-4 mr-2 border border-current rounded" />
                    Set Draft
                  </DropdownMenuItem>
                )}
                {currentStatus !== CallDTOStatus.ARCHIVED && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => call.id && onArchive(call.id)}
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
