'use client';

import Link from 'next/link';
import {
  Eye,
  Pencil,
  Trash2,
  Archive,
  MoreVertical,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { InlinePermissionGuard } from '@/core/auth';
import { RelationshipCell } from './relationship-cell';
import type { UserDraftDTO } from '@/core/api/generated/spring/schemas/UserDraftDTO';
import { UserDraftDTOStatus } from '@/core/api/generated/spring/schemas/UserDraftDTOStatus';

const ENTITY_ROUTES: Record<string, string> = {
  Call: '/calls/new',
  Customer: '/customers/new',
  Meeting: '/meetings/new',
  Source: '/sources/new',
  Priority: '/priorities/new',
  CallType: '/call-types/new',
  SubCallType: '/sub-call-types/new',
  CallCategory: '/call-categories/new',
  CallStatus: '/call-statuses/new',
  ChannelType: '/channel-types/new',
  UserProfile: '/user-profiles/new',
};

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

interface UserDraftTableRowProps {
  userDraft: UserDraftDTO;
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
  visibleColumns: Array<{
    id: string;
    label: string;
    accessor: string;
    type: 'field' | 'relationship';
    visible: boolean;
    sortable: boolean;
  }>;
}

export function UserDraftTableRow({
  userDraft,
  onArchive,
  onStatusChange,
  isUpdatingStatus,
  statusOptions,
  isSelected,
  onSelect,
  relationshipConfigs = [],
  onRelationshipUpdate,
  updatingCells = new Set(),
  visibleColumns,
}: UserDraftTableRowProps) {
  const router = useRouter();

  const currentStatus = userDraft.status;
  const statusInfo = statusOptions.find(
    (opt) => opt.value === currentStatus || opt.value.toString() === currentStatus
  );

  const handleRestoreDraft = () => {
    if (!userDraft.type) {
      toast.error('Cannot restore draft: Entity type not found');
      return;
    }

    const route = ENTITY_ROUTES[userDraft.type];
    if (!route) {
      toast.error(`No route found for entity type: ${userDraft.type}`);
      return;
    }

    try {
      const payload = JSON.parse(userDraft.jsonPayload || '{}');

      const restorationData = {
        draftId: userDraft.id,
        entityType: userDraft.type,
        formData: payload.formData || {},
        currentStep: payload.currentStep || 0,
        timestamp: Date.now(),
      };

      sessionStorage.setItem('draftToRestore', JSON.stringify(restorationData));

      router.push(route);
      toast.success(`Navigating to restore ${userDraft.type} draft...`);
    } catch (error) {
      console.error('Error parsing draft data:', error);
      toast.error('Error parsing draft data. Cannot restore this draft.');
    }
  };

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
          onCheckedChange={() => userDraft.id && onSelect(userDraft.id)}
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
                const field = userDraft[column.accessor as keyof typeof userDraft];

                if (column.id === 'keycloakUserId') {
                  return field?.toString() || '';
                }

                if (column.id === 'type') {
                  return field?.toString() || '';
                }

                if (column.id === 'jsonPayload') {
                  return field?.toString() || '';
                }

                if (column.id === 'status') {
                  return getStatusBadge(field as string);
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

                if (column.id === 'leadNo') {
                  try {
                    const payload = JSON.parse(userDraft.jsonPayload || '{}');
                    const leadNo = payload.formData?.leadNo;
                    if (leadNo && typeof leadNo === 'string') {
                      if (leadNo.length === 8 && /^[A-Z]{3}\d{5}$/.test(leadNo)) {
                        return `${leadNo.substring(0, 3)}-${leadNo.substring(3)}`;
                      }
                      return leadNo;
                    }
                    return userDraft.type === 'Call' ? '-' : 'N/A';
                  } catch {
                    return userDraft.type === 'Call' ? '-' : 'N/A';
                  }
                }

                if (column.id === 'currentStep') {
                  try {
                    const payload = JSON.parse(userDraft.jsonPayload || '{}');
                    const currentStep = payload.currentStep;
                    if (typeof currentStep === 'number') {
                      return `Step ${currentStep + 1}`;
                    }
                    return 'Step 1';
                  } catch {
                    return 'Step 1';
                  }
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
          {/* Restore Draft Button - Only show for active drafts */}
          {currentStatus === UserDraftDTOStatus.ACTIVE && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRestoreDraft}
              className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-blue-600 hover:text-blue-700"
              title="Restore Draft"
            >
              <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span className="sr-only">Restore Draft</span>
            </Button>
          )}

          {/* Status Management Dropdown */}
          <InlinePermissionGuard requiredPermission="userDraft:update">
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
                {currentStatus !== UserDraftDTOStatus.ACTIVE && (
                  <DropdownMenuItem
                    onClick={() => userDraft.id && onStatusChange(userDraft.id, 'ACTIVE')}
                    className="text-green-700"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Set Active
                  </DropdownMenuItem>
                )}
                {currentStatus !== UserDraftDTOStatus.INACTIVE && (
                  <DropdownMenuItem
                    onClick={() => userDraft.id && onStatusChange(userDraft.id, 'INACTIVE')}
                    className="text-yellow-700"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Set Inactive
                  </DropdownMenuItem>
                )}
                {currentStatus !== UserDraftDTOStatus.DRAFT && (
                  <DropdownMenuItem
                    onClick={() => userDraft.id && onStatusChange(userDraft.id, 'DRAFT')}
                    className="text-gray-700"
                  >
                    <div className="w-4 h-4 mr-2 border border-current rounded" />
                    Set Draft
                  </DropdownMenuItem>
                )}
                {currentStatus !== UserDraftDTOStatus.ARCHIVED && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => userDraft.id && onArchive(userDraft.id)}
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
