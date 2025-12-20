'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { callToast, handleCallError } from './call-toast';
import { CallDTOStatus } from '@/core/api/generated/spring/schemas/CallDTOStatus';
import type { GetAllCallRemarksParams } from '@/core/api/generated/spring/schemas/GetAllCallRemarksParams';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount, useUserAuthorities } from '@/core/auth';
import {
  AlertTriangle,
  Archive,
  Download,
  Eye,
  EyeOff,
  RotateCcw,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useCountCalls,
  useGetAllCalls,
  useSearchCalls,
  useUpdateCall,
} from '@/core/api/generated/spring/endpoints/call-resource/call-resource.gen';
import {
  getAllCallRemarks,
  useGetAllCallRemarks,
} from '@/core/api/generated/spring/endpoints/call-remark-resource/call-remark-resource.gen';

import { useGetAllPriorities } from '@/core/api/generated/spring/endpoints/priority-resource/priority-resource.gen';

import { useGetAllCallTypes } from '@/core/api/generated/spring/endpoints/call-type-resource/call-type-resource.gen';

import { useGetAllSubCallTypes } from '@/core/api/generated/spring/endpoints/sub-call-type-resource/sub-call-type-resource.gen';

import { useGetAllSources } from '@/core/api/generated/spring/endpoints/source-resource/source-resource.gen';

import { useGetAllCustomers } from '@/core/api/generated/spring/endpoints/customer-resource/customer-resource.gen';

import { useGetAllProducts } from '@/core/api/generated/spring/endpoints/product-resource/product-resource.gen';

import { useGetAllChannelTypes } from '@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen';

import { useGetAllUserProfiles } from '@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen';

import { useGetAllCallStatuses } from '@/core/api/generated/spring/endpoints/call-status-resource/call-status-resource.gen';
import { CallTableHeader } from './table/call-table-header';
import { CallTableRow, type LatestRemarksMap } from './table/call-table-row';
import { BulkRelationshipAssignment } from './table/bulk-relationship-assignment';
import { AdvancedPagination, usePaginationState } from './table/advanced-pagination';

const TABLE_CONFIG = {
  showDraftTab: false,
  centerAlignActions: true,
};

const EXCLUDED_ASSIGNED_EMAIL = 'admin@gmail.com';

function transformEnumValue(enumValue: string): string {
  if (!enumValue || typeof enumValue !== 'string') return enumValue;

  return enumValue
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

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

interface ColumnConfig {
  id: string;
  label: string;
  accessor: string;
  type: 'field' | 'relationship' | 'custom';
  visible: boolean;
  sortable: boolean;
}

const ALL_COLUMNS: ColumnConfig[] = [
  {
    id: 'leadNo',
    label: 'Lead No',
    accessor: 'leadNo',
    type: 'field',
    visible: true,
    sortable: true,
  },

  {
    id: 'externalId',
    label: 'External Id',
    accessor: 'externalId',
    type: 'field',
    visible: true,
    sortable: true,
  },

  {
    id: 'status',
    label: 'Status',
    accessor: 'status',
    type: 'field',
    visible: true,
    sortable: true,
  },

  {
    id: 'priority',
    label: 'Priority',
    accessor: 'priority',
    type: 'relationship',
    visible: true,
    sortable: false,
  },

  {
    id: 'callType',
    label: 'Call Type',
    accessor: 'callType',
    type: 'relationship',
    visible: true,
    sortable: false,
  },

  {
    id: 'subCallType',
    label: 'Sub Call Type',
    accessor: 'subCallType',
    type: 'relationship',
    visible: false,
    sortable: false,
  },

  {
    id: 'source',
    label: 'Source',
    accessor: 'source',
    type: 'relationship',
    visible: false,
    sortable: false,
  },

  {
    id: 'customer',
    label: 'Customer',
    accessor: 'customer',
    type: 'relationship',
    visible: true,
    sortable: false,
  },

  {
    id: 'product',
    label: 'Product',
    accessor: 'product',
    type: 'relationship',
    visible: false,
    sortable: false,
  },

  {
    id: 'channelType',
    label: 'Channel Type',
    accessor: 'channelType',
    type: 'relationship',
    visible: false,
    sortable: false,
  },

  {
    id: 'channelParties',
    label: 'Channel Parties',
    accessor: 'channelParties',
    type: 'relationship',
    visible: false,
    sortable: false,
  },

  {
    id: 'assignedTo',
    label: 'Assigned To',
    accessor: 'assignedTo',
    type: 'relationship',
    visible: true,
    sortable: false,
  },

  {
    id: 'callStatus',
    label: 'Call Status',
    accessor: 'callStatus',
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
  {
    id: 'remarks',
    label: 'Remarks',
    accessor: 'remarks',
    type: 'custom',
    visible: true,
    sortable: false,
  },
];

const COLUMN_VISIBILITY_KEY = 'call-table-columns';
const EXTERNAL_COLUMN_VISIBILITY_KEY = 'call-table-external-columns';
const EXTERNAL_COLUMN_OVERRIDES: Record<string, boolean> = {
  leadNo: true,
  externalId: true,
};
// Tab-specific column visibility requirements (e.g., CRM vs Business Partner vs External).
const TAB_COLUMN_RULES: Record<
  string,
  {
    forceShow?: string[];
    forceHide?: string[];
  }
> = {
  'crm-leads': {
    forceHide: ['externalId', 'channelType', 'channelParties'],
  },
  'business-partners': {
    forceShow: ['channelType', 'channelParties'],
    forceHide: ['externalId'],
  },
  external: {
    forceShow: ['externalId', 'leadNo'],
    forceHide: ['channelType', 'channelParties'],
  },
};

const getDefaultColumnVisibility = (overrides: Record<string, boolean> = {}) =>
  ALL_COLUMNS.reduce(
    (acc, col) => ({
      ...acc,
      [col.id]: overrides[col.id] ?? col.visible,
    }),
    {}
  );

interface FilterState {
  [key: string]: string | string[] | Date | undefined;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export function CallTable() {
  const queryClient = useQueryClient();
  const { hasGroup } = useUserAuthorities();
  const { data: accountData } = useAccount();
  const isBusinessPartner = hasGroup('Business Partners');
  const isUserGroup = hasGroup('Users') && !isBusinessPartner && !hasGroup('Admins') && !hasGroup('Super Admins');

  const { page, pageSize, handlePageChange, handlePageSizeChange, resetPagination } =
    usePaginationState(1, 10);

  const [sort, setSort] = useState('lastModifiedDate');
  const [order, setOrder] = useState(DESC);
  const [searchTerm, setSearchTerm] = useState('');
  const [archiveId, setArchiveId] = useState<number | null>(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [statusChangeId, setStatusChangeId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
  const [activeStatusTab, setActiveStatusTab] = useState<string>(
    isBusinessPartner ? 'business-partners' : 'crm-leads'
  );
  const [isArchiveCompleted, setIsArchiveCompleted] = useState(false);

  const handleArchiveSuccess = () => {
    setIsArchiveCompleted(true);
  };

  useEffect(() => {
    if (isBusinessPartner) {
      setActiveStatusTab('business-partners');
    }
  }, [isBusinessPartner]);
  const [filters, setFilters] = useState<FilterState>({});
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showBulkArchiveDialog, setShowBulkArchiveDialog] = useState(false);
  const [showBulkStatusChangeDialog, setShowBulkStatusChangeDialog] = useState(false);
  const [bulkNewStatus, setBulkNewStatus] = useState<string | null>(null);
  const [showBulkRelationshipDialog, setShowBulkRelationshipDialog] = useState(false);

  const [updatingCells, setUpdatingCells] = useState<Set<string>>(new Set());
  const [fallbackRemarks, setFallbackRemarks] = useState<LatestRemarksMap>({});
  const [isFallbackRemarksLoading, setIsFallbackRemarksLoading] = useState(false);

  const [isColumnVisibilityLoaded, setIsColumnVisibilityLoaded] = useState(false);
  const [isExternalColumnVisibilityLoaded, setIsExternalColumnVisibilityLoaded] = useState(false);

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [externalColumnVisibility, setExternalColumnVisibility] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY);
      const oldKey = 'call-table-columns';

      if (saved) {
        setColumnVisibility(JSON.parse(saved));
      } else {
        const oldSaved = localStorage.getItem(oldKey);
        if (oldSaved) {
          localStorage.removeItem(oldKey);
        }

        setColumnVisibility(getDefaultColumnVisibility());
      }
    } catch (error) {
      console.warn('Failed to load column visibility from localStorage:', error);

      setColumnVisibility(getDefaultColumnVisibility());
    } finally {
      setIsColumnVisibilityLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isColumnVisibilityLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility));
      } catch (error) {
        console.warn('Failed to save column visibility to localStorage:', error);
      }
    }
  }, [columnVisibility, isColumnVisibilityLoaded]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(EXTERNAL_COLUMN_VISIBILITY_KEY);
      if (saved) {
        setExternalColumnVisibility(JSON.parse(saved));
      } else {
        setExternalColumnVisibility(getDefaultColumnVisibility(EXTERNAL_COLUMN_OVERRIDES));
      }
    } catch (error) {
      console.warn('Failed to load external column visibility from localStorage:', error);
      setExternalColumnVisibility(getDefaultColumnVisibility(EXTERNAL_COLUMN_OVERRIDES));
    } finally {
      setIsExternalColumnVisibilityLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isExternalColumnVisibilityLoaded && typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          EXTERNAL_COLUMN_VISIBILITY_KEY,
          JSON.stringify(externalColumnVisibility)
        );
      } catch (error) {
        console.warn('Failed to save external column visibility to localStorage:', error);
      }
    }
  }, [externalColumnVisibility, isExternalColumnVisibilityLoaded]);

  const columnVisibilityMap =
    activeStatusTab === 'external' ? externalColumnVisibility : columnVisibility;

  const getColumnVisibilityForCurrentTab = useCallback(
    (columnId: string) => {
      const tabRules = TAB_COLUMN_RULES[activeStatusTab] || {};

      if (tabRules.forceHide?.includes(columnId)) {
        return false;
      }

      if (tabRules.forceShow?.includes(columnId)) {
        return true;
      }

      if (
        (activeStatusTab === 'business-partners' || isBusinessPartner) &&
        columnId === 'assignedTo'
      ) {
        return false;
      }

      return columnVisibilityMap[columnId] !== false;
    },
    [activeStatusTab, columnVisibilityMap, isBusinessPartner]
  );

  const isColumnVisibilityLocked = useCallback(
    (columnId: string) => {
      const tabRules = TAB_COLUMN_RULES[activeStatusTab] || {};

      if (tabRules.forceHide?.includes(columnId) || tabRules.forceShow?.includes(columnId)) {
        return true;
      }

      if (
        (activeStatusTab === 'business-partners' || isBusinessPartner) &&
        columnId === 'assignedTo'
      ) {
        return true;
      }

      return false;
    },
    [activeStatusTab, isBusinessPartner]
  );

  const visibleColumns = useMemo(() => {
    return ALL_COLUMNS.filter((col) => getColumnVisibilityForCurrentTab(col.id));
  }, [getColumnVisibilityForCurrentTab]);

  const toggleColumnVisibility = (columnId: string) => {
    if (isColumnVisibilityLocked(columnId)) {
      return;
    }

    if (activeStatusTab === 'external') {
      setExternalColumnVisibility((prev) => ({
        ...prev,
        [columnId]: !prev[columnId],
      }));
      return;
    }

    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  const exportToCSV = () => {
    if (!filteredData || filteredData.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = visibleColumns.map((col) => col.label);
    const csvContent = [
      headers.join(','),
      ...filteredData.map((item) => {
        return visibleColumns
          .map((col) => {
            let value = '';
            if (col.type === 'field') {
              const fieldValue = item[col.accessor as keyof typeof item];
              value = fieldValue !== null && fieldValue !== undefined ? String(fieldValue) : '';
            } else if (col.type === 'relationship') {
              const relationship = item[col.accessor as keyof typeof item] as any;

              if (col.id === 'priority' && relationship) {
                value = relationship.name || '';
              }

              if (col.id === 'callType' && relationship) {
                value = relationship.name || '';
              }

              if (col.id === 'subCallType' && relationship) {
                value = relationship.name || '';
              }

              if (col.id === 'source' && relationship) {
                value = relationship.name || '';
              }

              if (col.id === 'customer' && relationship) {
                value = relationship.customerBusinessName || '';
              }

              if (col.id === 'product' && relationship) {
                value = relationship.name || '';
              }

              if (col.id === 'channelType' && relationship) {
                value = relationship.name || '';
              }

              if (col.id === 'channelParties' && relationship) {
                value = relationship.displayName || '';
              }

              if (col.id === 'assignedTo' && relationship) {
                value = isExcludedAssignedUser(relationship) ? '' : relationship.displayName || '';
              }

              if (col.id === 'callStatus' && relationship) {
                value = relationship.name || '';
              }
            } else if (col.id === 'remarks') {
              const callId = item.id;
              if (typeof callId === 'number') {
                value = latestRemarksMap[callId]?.remark || '';
              } else {
                value = '';
              }
            }

            if (
              typeof value === 'string' &&
              (value.includes(',') || value.includes('"') || value.includes('\n'))
            ) {
              value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',');
      }),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `call-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('Data exported successfully');
  };

  const apiPage = page - 1;

  const { data: priorityOptions = [] } = useGetAllPriorities(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );

  const { data: calltypeOptions = [] } = useGetAllCallTypes(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );

  const { data: subcalltypeOptions = [] } = useGetAllSubCallTypes(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );

  const { data: sourceOptions = [] } = useGetAllSources(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );

  const { data: customerOptions = [] } = useGetAllCustomers(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );

  const { data: productOptions = [] } = useGetAllProducts(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );

  const { data: channeltypeOptions = [] } = useGetAllChannelTypes(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );

  const { data: userprofileOptions = [] } = useGetAllUserProfiles(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );

  const assignedToOptions = useMemo(
    () =>
      (userprofileOptions || []).filter(
        (user: any) =>
          user?.email?.toLowerCase?.() !== EXCLUDED_ASSIGNED_EMAIL.toLowerCase()
      ),
    [userprofileOptions]
  );

  const { data: callstatusOptions = [] } = useGetAllCallStatuses(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );

  const isExcludedAssignedUser = (user: any) =>
    user?.email?.toLowerCase?.() === EXCLUDED_ASSIGNED_EMAIL.toLowerCase();

  const findEntityIdByName = (entities: any[], name: string, displayField: string = 'name') => {
    const entity = entities?.find((e) =>
      e[displayField]?.toLowerCase().includes(name.toLowerCase())
    );
    return entity?.id;
  };

  const isBusinessPartnerCall = (call: any) => {
    if (!call.channelType || !call.channelParties) {
      return false;
    }
    return !!call.channelType && !!call.channelParties;
  };

  const isCrmLeadCall = (call: any) => !isBusinessPartnerCall(call) && !call.externalId;

  const statusOptions = [
    {
      value: CallDTOStatus.DRAFT,
      label: transformEnumValue('DRAFT'),
      color: 'bg-gray-100 text-gray-800',
    },
    {
      value: CallDTOStatus.ACTIVE,
      label: transformEnumValue('ACTIVE'),
      color: 'bg-green-100 text-green-800',
    },
    {
      value: CallDTOStatus.INACTIVE,
      label: transformEnumValue('INACTIVE'),
      color: 'bg-yellow-100 text-yellow-800',
    },
    {
      value: CallDTOStatus.ARCHIVED,
      label: transformEnumValue('ARCHIVED'),
      color: 'bg-red-100 text-red-800',
    },
  ];

  const getStatusFilter = () => {
    switch (activeStatusTab) {
      case 'crm-leads':
        return { 'externalId.specified': false };
      case 'business-partners':
        return { 'status.equals': CallDTOStatus.ACTIVE, 'externalId.specified': false };
      case 'draft':
        return { 'status.equals': CallDTOStatus.DRAFT };
      case 'active':
        return { 'status.equals': CallDTOStatus.ACTIVE };
      case 'inactive':
        return { 'status.equals': CallDTOStatus.INACTIVE };
      case 'archived':
        return { 'status.equals': CallDTOStatus.ARCHIVED };
      case 'external':
        return {};
      case 'all':
        return {};
      default:
        return { 'status.equals': CallDTOStatus.ACTIVE };
    }
  };

  const buildFilterParams = () => {
    const params: Record<string, any> = {
      ...getStatusFilter(),
    };

    if (activeStatusTab === 'external') {
      params['externalId.specified'] = true;
    }

    const relationshipMappings = {
      'priority.name': {
        apiParam: 'priorityId.equals',
        options: priorityOptions,
        displayField: 'name',
      },

      'callType.name': {
        apiParam: 'callTypeId.equals',
        options: calltypeOptions,
        displayField: 'name',
      },

      'subCallType.name': {
        apiParam: 'subCallTypeId.equals',
        options: subcalltypeOptions,
        displayField: 'name',
      },

      'source.name': {
        apiParam: 'sourceId.equals',
        options: sourceOptions,
        displayField: 'name',
      },

      'customer.customerBusinessName': {
        apiParam: 'customerId.equals',
        options: customerOptions,
        displayField: 'customerBusinessName',
      },

      'product.name': {
        apiParam: 'productId.equals',
        options: productOptions,
        displayField: 'name',
      },

      'channelType.name': {
        apiParam: 'channelTypeId.equals',
        options: channeltypeOptions,
        displayField: 'name',
      },

      'channelParties.displayName': {
        apiParam: 'channelPartiesId.equals',
        options: userprofileOptions,
        displayField: 'displayName',
      },

      'assignedTo.displayName': {
        apiParam: 'assignedToId.equals',
        options: assignedToOptions,
        displayField: 'displayName',
      },

      'callStatus.name': {
        apiParam: 'callStatusId.equals',
        options: callstatusOptions,
        displayField: 'name',
      },
    };

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        if (relationshipMappings[key]) {
          const mapping = relationshipMappings[key];
          const entityId = findEntityIdByName(
            mapping.options,
            value as string,
            mapping.displayField
          );
          if (entityId) {
            params[mapping.apiParam] = entityId;
          }
        } else if (key === 'createdDate') {
          if (value instanceof Date) {
            params['createdDate.equals'] = value.toISOString().split('T')[0];
          } else if (typeof value === 'string' && value.trim() !== '') {
            params['createdDate.equals'] = value;
          }
        } else if (key === 'lastModifiedDate') {
          if (value instanceof Date) {
            params['lastModifiedDate.equals'] = value.toISOString().split('T')[0];
          } else if (typeof value === 'string' && value.trim() !== '') {
            params['lastModifiedDate.equals'] = value;
          }
        } else if (key === 'status') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['status.contains'] = value;
          }
        } else if (key === 'createdBy') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['createdBy.contains'] = value;
          }
        } else if (key === 'lastModifiedBy') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['lastModifiedBy.contains'] = value;
          }
        } else if (key === 'externalId') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['externalId.contains'] = value;
          }
        } else if (Array.isArray(value) && value.length > 0) {
          params[key] = value;
        } else if (typeof value === 'string' && value.trim() !== '') {
          params[`${key}.contains`] = value;
        }
      }
    });

    if (dateRange.from) {
      params['createdDate.greaterThanOrEqual'] = dateRange.from.toISOString();
    }
    if (dateRange.to) {
      params['createdDate.lessThanOrEqual'] = dateRange.to.toISOString();
    }

    if (dateRange.from) {
      params['lastModifiedDate.greaterThanOrEqual'] = dateRange.from.toISOString();
    }
    if (dateRange.to) {
      params['lastModifiedDate.lessThanOrEqual'] = dateRange.to.toISOString();
    }

    if (isBusinessPartner && accountData?.login) {
      params['createdBy.equals'] = accountData.login;
    }

    return params;
  };

  const filterParams = buildFilterParams();

  const { data, isLoading, refetch } = searchTerm
    ? useSearchCalls(
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
    : useGetAllCalls(
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

  const handleRefresh = useCallback(async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: ['getAllCalls'],
        refetchType: 'active',
      });
      await queryClient.invalidateQueries({
        queryKey: ['countCalls'],
        refetchType: 'active',
      });

      await queryClient.invalidateQueries({
        queryKey: ['searchCalls'],
        refetchType: 'active',
      });

      await refetch();

      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error('Failed to refresh data');
    }
  }, [queryClient, refetch]);

  useEffect(() => {
    if (isArchiveCompleted) {
      handleRefresh();
      setIsArchiveCompleted(false);
    }
  }, [isArchiveCompleted, handleRefresh]);

  const { data: countData } = useCountCalls(filterParams, {
    query: {
      enabled: true,
      staleTime: 0,
      refetchOnWindowFocus: true,
    },
  });

  const filteredData = useMemo(() => {
    if (!data) return data;

    let filtered = data;

    if (activeStatusTab === 'crm-leads') {
      filtered = filtered.filter(isCrmLeadCall);
    }

    if (activeStatusTab === 'business-partners') {
      filtered = filtered.filter(isBusinessPartnerCall);
    }

    if (activeStatusTab === 'active') {
      filtered = filtered.filter((call) => call.status === CallDTOStatus.ACTIVE);
    }

    if (activeStatusTab === 'external') {
      filtered = filtered.filter((call) => !!call.externalId);
    }

    // Apply user-specific filtering for Users group members
    if (isUserGroup && accountData?.login) {
      filtered = filtered.filter((call) =>
        call.createdBy === accountData.login ||
        call.assignedTo?.id === accountData.id
      );
    }

    return filtered;
  }, [data, activeStatusTab, isUserGroup, accountData?.login, accountData?.id]);

  const filteredCount = useMemo(() => {
    if (!countData) return 0;

    if (
      activeStatusTab === 'business-partners' ||
      activeStatusTab === 'active' ||
      activeStatusTab === 'crm-leads' ||
      isUserGroup
    ) {
      return filteredData?.length || 0;
    }

    return countData;
  }, [countData, filteredData, activeStatusTab, isUserGroup]);

  const callIdsForRemarks = useMemo(
    () =>
      (filteredData ?? [])
        .map((call) => call.id)
        .filter((id): id is number => typeof id === 'number'),
    [filteredData]
  );

  useEffect(() => {
    if (!callIdsForRemarks.length) {
      setFallbackRemarks({});
      return;
    }

    setFallbackRemarks((prev) => {
      const allowedIds = new Set(callIdsForRemarks);
      const nextEntries = Object.entries(prev).filter(([id]) => allowedIds.has(Number(id)));

      if (nextEntries.length === Object.keys(prev).length) {
        return prev;
      }

      return nextEntries.reduce<LatestRemarksMap>((acc, [id, value]) => {
        acc[Number(id)] = value;
        return acc;
      }, {});
    });
  }, [callIdsForRemarks]);

  const remarkBatchSize = useMemo(() => {
    if (!callIdsForRemarks.length) return undefined;
    const calculatedSize = callIdsForRemarks.length * 5;
    const minSize = 25;
    const maxSize = 1000;
    return Math.min(Math.max(calculatedSize, minSize), maxSize);
  }, [callIdsForRemarks]);

  const remarkBatchParams = useMemo<GetAllCallRemarksParams | undefined>(() => {
    if (!callIdsForRemarks.length || !remarkBatchSize) {
      return undefined;
    }

    return {
      'callId.in': callIdsForRemarks,
      page: 0,
      size: remarkBatchSize,
      sort: ['dateTime,desc'],
    };
  }, [callIdsForRemarks, remarkBatchSize]);

  const {
    data: remarkBatchData = [],
    isFetching: isRemarkBatchFetching,
  } = useGetAllCallRemarks(remarkBatchParams, {
    query: {
      enabled: !!remarkBatchParams,
      keepPreviousData: true,
      staleTime: 1000 * 15,
    },
  });

  const baseLatestRemarksMap = useMemo<LatestRemarksMap>(() => {
    const map: LatestRemarksMap = {};
    if (!remarkBatchData.length || !callIdsForRemarks.length) {
      return map;
    }

    const allowedCallIds = new Set(callIdsForRemarks);
    remarkBatchData.forEach((remark) => {
      const callId = remark.call?.id;
      if (
        typeof callId === 'number' &&
        allowedCallIds.has(callId) &&
        !map[callId] &&
        remark.remark
      ) {
        map[callId] = {
          remark: remark.remark,
          dateTime: remark.dateTime,
        };
      }
    });

    return map;
  }, [remarkBatchData, callIdsForRemarks]);

  const missingCallIds = useMemo(() => {
    if (!callIdsForRemarks.length) {
      return [];
    }

    return callIdsForRemarks.filter(
      (callId) => !baseLatestRemarksMap[callId] && !fallbackRemarks[callId]
    );
  }, [callIdsForRemarks, baseLatestRemarksMap, fallbackRemarks]);

  useEffect(() => {
    if (!missingCallIds.length || isRemarkBatchFetching) {
      if (!missingCallIds.length) {
        setIsFallbackRemarksLoading(false);
      }
      return;
    }

    let isCancelled = false;

    const fetchFallbackRemarks = async () => {
      setIsFallbackRemarksLoading(true);

      try {
        const results = await Promise.all(
          missingCallIds.map((callId) =>
            getAllCallRemarks(
              {
                'callId.equals': callId,
                page: 0,
                size: 1,
                sort: ['dateTime,desc'],
              },
              undefined
            )
          )
        );

        if (isCancelled) {
          return;
        }

        setFallbackRemarks((prev) => {
          const next = { ...prev };
          let hasChanges = false;

          results.forEach((remarks, index) => {
            const remark = remarks?.[0];
            const callId = missingCallIds[index];
            if (
              remark?.remark &&
              typeof callId === 'number' &&
              (!next[callId] || next[callId]?.remark !== remark.remark)
            ) {
              next[callId] = {
                remark: remark.remark,
                dateTime: remark.dateTime,
              };
              hasChanges = true;
            }
          });

          return hasChanges ? next : prev;
        });
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to fetch fallback remarks', error);
        }
      } finally {
        if (!isCancelled) {
          setIsFallbackRemarksLoading(false);
        }
      }
    };

    fetchFallbackRemarks();

    return () => {
      isCancelled = true;
    };
  }, [missingCallIds, isRemarkBatchFetching]);

  const latestRemarksMap = useMemo<LatestRemarksMap>(() => {
    if (!Object.keys(fallbackRemarks).length) {
      return baseLatestRemarksMap;
    }

    return {
      ...baseLatestRemarksMap,
      ...fallbackRemarks,
    };
  }, [baseLatestRemarksMap, fallbackRemarks]);

  const isLatestRemarksLoading = isRemarkBatchFetching || isFallbackRemarksLoading;

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateCall({
    mutation: {
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: ['getAllCalls'],
        });

        await queryClient.cancelQueries({
          queryKey: ['searchCalls'],
        });

        const previousData = queryClient.getQueryData([
          'getAllCalls',
          {
            page: apiPage,
            size: pageSize,
            sort: [`${sort},${order}`],
            ...filterParams,
          },
        ]);

        if (previousData && Array.isArray(previousData)) {
          queryClient.setQueryData(
            [
              'getAllCalls',
              {
                page: apiPage,
                size: pageSize,
                sort: [`${sort},${order}`],
                ...filterParams,
              },
            ],
            (old: any[]) =>
              old.map((call) => (call.id === variables.id ? { ...call, ...variables.data } : call))
          );
        }

        if (searchTerm) {
          queryClient.setQueryData(
            [
              'searchCalls',
              {
                query: searchTerm,
                page: apiPage,
                size: pageSize,
                sort: [`${sort},${order}`],
                ...filterParams,
              },
            ],
            (old: any[]) =>
              old?.map((call) => (call.id === variables.id ? { ...call, ...variables.data } : call))
          );
        }

        return { previousData };
      },
      onSuccess: (data, variables) => {
        queryClient.setQueryData(
          [
            'getAllCalls',
            {
              page: apiPage,
              size: pageSize,
              sort: [`${sort},${order}`],
              ...filterParams,
            },
          ],
          (old: any[]) => old?.map((call) => (call.id === variables.id ? data : call))
        );

        if (searchTerm) {
          queryClient.setQueryData(
            [
              'searchCalls',
              {
                query: searchTerm,
                page: apiPage,
                size: pageSize,
                sort: [`${sort},${order}`],
                ...filterParams,
              },
            ],
            (old: any[]) => old?.map((call) => (call.id === variables.id ? data : call))
          );
        }

        callToast.updated();
      },
      onError: (error, variables, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(
            [
              'getAllCalls',
              {
                page: apiPage,
                size: pageSize,
                sort: [`${sort},${order}`],
                ...filterParams,
              },
            ],
            context.previousData
          );
        }
        handleCallError(error);
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({
          queryKey: ['getAllCalls'],
          refetchType: 'active',
        });
        await queryClient.invalidateQueries({
          queryKey: ['countCalls'],
          refetchType: 'active',
        });

        await queryClient.invalidateQueries({
          queryKey: ['searchCalls'],
          refetchType: 'active',
        });
      },
    },
  });

  const { mutate: updateEntityStatus, isPending: isUpdatingStatus } = useUpdateCall({
    mutation: {
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: ['getAllCalls'] });

        const previousData = queryClient.getQueryData([
          'getAllCalls',
          {
            page: apiPage,
            size: pageSize,
            sort: [`${sort},${order}`],
            ...filterParams,
          },
        ]);

        queryClient.setQueryData(
          [
            'getAllCalls',
            {
              page: apiPage,
              size: pageSize,
              sort: [`${sort},${order}`],
              ...filterParams,
            },
          ],
          (old: any[]) => {
            if (!old) return old;

            const newStatus = variables.data.status;
            const currentFilter = getStatusFilter();
            const currentStatusFilter = currentFilter['status.equals'];

            console.log('Optimistic Update Debug:', {
              newStatus,
              currentStatusFilter,
              activeStatusTab,
              shouldStayInView: currentStatusFilter === newStatus || activeStatusTab === 'all',
              comparison: `${currentStatusFilter} === ${newStatus}`,
              entityId: variables.id,
            });

            if (currentStatusFilter === newStatus || activeStatusTab === 'all') {
              console.log(`Updating item ${variables.id} in place`);
              return old.map((call) =>
                call.id === variables.id ? { ...call, ...variables.data } : call
              );
            } else {
              console.log(`Removing item ${variables.id} from current view`);
              return old.filter((call) => call.id !== variables.id);
            }
          }
        );

        return { previousData };
      },
      onSuccess: (data, variables) => {
        const statusLabel =
          statusOptions.find((opt) => opt.value.includes(variables.data.status))?.label ||
          variables.data.status;
        callToast.custom.success(`Status Updated`, `Call status changed to ${statusLabel}`);

        if (variables.data.status === CallDTOStatus.ARCHIVED) {
          handleArchiveSuccess();
        }

        const currentFilter = getStatusFilter();
        const currentStatusFilter = currentFilter['status.equals'];
        const newStatus = variables.data.status;

        if (currentStatusFilter !== newStatus && activeStatusTab !== 'all') {
          console.log(
            `Updating count cache - removing 1 item due to status change from ${currentStatusFilter} to ${newStatus}`
          );
          queryClient.setQueryData(['countCalls', filterParams], (old: number) =>
            Math.max(0, (old || 0) - 1)
          );
        }
      },
      onError: (error, variables, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(
            [
              'getAllCalls',
              {
                page: apiPage,
                size: pageSize,
                sort: [`${sort},${order}`],
                ...filterParams,
              },
            ],
            context.previousData
          );
        }
        handleCallError(error);
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({
          queryKey: ['getAllCalls'],
          refetchType: 'active',
        });
        await queryClient.invalidateQueries({
          queryKey: ['countCalls'],
          refetchType: 'active',
        });

        await queryClient.invalidateQueries({
          queryKey: ['searchCalls'],
          refetchType: 'active',
        });
      },
    },
  });

  const handleSort = (column: string) => {
    if (sort === column) {
      setOrder(order === ASC ? DESC : ASC);
    } else {
      setSort(column);
      setOrder(ASC);
    }
  };

  const getSortIcon = (column: string) => {
    if (sort !== column) {
      return 'ChevronsUpDown';
    }
    return order === ASC ? 'ChevronUp' : 'ChevronDown';
  };

  const handleArchive = (id: number) => {
    setArchiveId(id);
    setShowArchiveDialog(true);
  };

  const handleStatusChange = (id: number, status: string) => {
    setStatusChangeId(id);
    setNewStatus(status);
    setShowStatusChangeDialog(true);
  };

  const confirmArchive = () => {
    if (archiveId) {
      const currentEntity = filteredData?.find((item) => item.id === archiveId);
      if (currentEntity) {
        updateEntityStatus({
          id: archiveId,
          data: { ...currentEntity, status: CallDTOStatus.ARCHIVED },
        });
      }
    }
    setShowArchiveDialog(false);
    setArchiveId(null);
  };

  const confirmStatusChange = () => {
    if (statusChangeId && newStatus) {
      const currentEntity = filteredData?.find((item) => item.id === statusChangeId);
      if (currentEntity) {
        const statusValue = CallDTOStatus[newStatus as keyof typeof CallDTOStatus];
        updateEntityStatus({
          id: statusChangeId,
          data: { ...currentEntity, status: statusValue },
        });
      }
    }
    setShowStatusChangeDialog(false);
    setStatusChangeId(null);
    setNewStatus(null);
  };

  const handleFilterChange = (column: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
    resetPagination();
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchTerm('');
    setDateRange({ from: undefined, to: undefined });
    resetPagination();
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    resetPagination();
  };

  const totalItems = filteredCount || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  const handleSelectRow = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = () => {
    if (filteredData && selectedRows.size === filteredData.length) {
      setSelectedRows(new Set());
    } else if (filteredData) {
      setSelectedRows(
        new Set(filteredData.map((item) => item.id).filter((id): id is number => id !== undefined))
      );
    }
  };

  const handleBulkArchive = () => {
    setShowBulkArchiveDialog(true);
  };

  const handleBulkStatusChange = (status: string) => {
    setBulkNewStatus(status);
    setShowBulkStatusChangeDialog(true);
  };

  const confirmBulkArchive = async () => {
    await queryClient.cancelQueries({ queryKey: ['getAllCalls'] });

    const previousData = queryClient.getQueryData([
      'getAllCalls',
      {
        page: apiPage,
        size: pageSize,
        sort: [`${sort},${order}`],
        ...filterParams,
      },
    ]);

    try {
      const updatePromises = Array.from(selectedRows).map(async (id) => {
        const currentEntity = filteredData?.find((item) => item.id === id);
        if (currentEntity) {
          return new Promise<void>((resolve, reject) => {
            updateEntityStatus(
              {
                id,
                data: { ...currentEntity, status: CallDTOStatus.ARCHIVED },
              },
              {
                onSuccess: () => resolve(),
                onError: (error) => reject(error),
              }
            );
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);

      await queryClient.invalidateQueries({
        queryKey: ['getAllCalls'],
        refetchType: 'active',
      });
      await queryClient.invalidateQueries({
        queryKey: ['countCalls'],
        refetchType: 'active',
      });

      await queryClient.invalidateQueries({
        queryKey: ['searchCalls'],
        refetchType: 'active',
      });

      callToast.custom.success(
        'Bulk Archive Complete',
        `${selectedRows.size} item${selectedRows.size > 1 ? 's' : ''} archived successfully`
      );
      setSelectedRows(new Set());
    } catch (error) {
      if (previousData) {
        queryClient.setQueryData(
          [
            'getAllCalls',
            {
              page: apiPage,
              size: pageSize,
              sort: [`${sort},${order}`],
              ...filterParams,
            },
          ],
          previousData
        );
      }
      callToast.custom.error(
        'Bulk Archive Failed',
        'Some items could not be archived. Please try again.'
      );
    }
    setShowBulkArchiveDialog(false);
  };

  const confirmBulkStatusChange = async () => {
    if (!bulkNewStatus) return;

    await queryClient.cancelQueries({ queryKey: ['getAllCalls'] });

    const previousData = queryClient.getQueryData([
      'getAllCalls',
      {
        page: apiPage,
        size: pageSize,
        sort: [`${sort},${order}`],
        ...filterParams,
      },
    ]);

    try {
      const statusValue = CallDTOStatus[bulkNewStatus as keyof typeof CallDTOStatus];
      const updatePromises = Array.from(selectedRows).map(async (id) => {
        const currentEntity = filteredData?.find((item) => item.id === id);
        if (currentEntity) {
          return new Promise<void>((resolve, reject) => {
            updateEntityStatus(
              {
                id,
                data: { ...currentEntity, status: statusValue },
              },
              {
                onSuccess: () => resolve(),
                onError: (error) => reject(error),
              }
            );
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);

      await queryClient.invalidateQueries({
        queryKey: ['getAllCalls'],
        refetchType: 'active',
      });
      await queryClient.invalidateQueries({
        queryKey: ['countCalls'],
        refetchType: 'active',
      });

      await queryClient.invalidateQueries({
        queryKey: ['searchCalls'],
        refetchType: 'active',
      });

      const statusLabel =
        statusOptions.find((opt) => opt.value.includes(bulkNewStatus))?.label || bulkNewStatus;
      callToast.custom.success(
        'Bulk Status Update Complete',
        `${selectedRows.size} item${selectedRows.size > 1 ? 's' : ''} updated to ${statusLabel}`
      );
      setSelectedRows(new Set());
    } catch (error) {
      if (previousData) {
        queryClient.setQueryData(
          [
            'getAllCalls',
            {
              page: apiPage,
              size: pageSize,
              sort: [`${sort},${order}`],
              ...filterParams,
            },
          ],
          previousData
        );
      }
      callToast.custom.error(
        'Bulk Status Update Failed',
        'Some items could not be updated. Please try again.'
      );
    }
    setShowBulkStatusChangeDialog(false);
    setBulkNewStatus(null);
  };

  const handleRelationshipUpdate = async (
    entityId: number,
    relationshipName: string,
    newValue: number | null,
    isBulkOperation: boolean = false
  ) => {
    const cellKey = `${entityId}-${relationshipName}`;

    setUpdatingCells((prev) => new Set(prev).add(cellKey));

    return new Promise<void>((resolve, reject) => {
      const currentEntity = filteredData?.find((item) => item.id === entityId);
      if (!currentEntity) {
        setUpdatingCells((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cellKey);
          return newSet;
        });
        reject(new Error('Call not found in current data'));
        return;
      }

      const updateData: any = {
        ...currentEntity,
        id: entityId,
      };

      if (newValue) {
        const relationshipConfig = relationshipConfigs.find(
          (config) => config.name === relationshipName
        );
        const selectedOption = relationshipConfig?.options.find((opt) => opt.id === newValue);
        updateData[relationshipName] = selectedOption || { id: newValue };
      } else {
        updateData[relationshipName] = null;
      }

      updateEntity(
        {
          id: entityId,
          data: updateData,
        },
        {
          onSuccess: (serverResponse) => {
            if (isBulkOperation) {
              queryClient.setQueryData(
                [
                  'getAllCalls',
                  {
                    page: apiPage,
                    size: pageSize,
                    sort: [`${sort},${order}`],
                    ...filterParams,
                  },
                ],
                (old: any[]) => old?.map((call) => (call.id === entityId ? serverResponse : call))
              );

              if (searchTerm) {
                queryClient.setQueryData(
                  [
                    'searchCalls',
                    {
                      query: searchTerm,
                      page: apiPage,
                      size: pageSize,
                      sort: [`${sort},${order}`],
                      ...filterParams,
                    },
                  ],
                  (old: any[]) => old?.map((call) => (call.id === entityId ? serverResponse : call))
                );
              }
            }

            if (!isBulkOperation) {
              callToast.relationshipUpdated(relationshipName);
            }
            resolve();
          },
          onError: (error: any) => {
            reject(error);
          },
          onSettled: () => {
            setUpdatingCells((prev) => {
              const newSet = new Set(prev);
              newSet.delete(cellKey);
              return newSet;
            });
          },
        }
      );
    });
  };

  const handleBulkRelationshipUpdate = async (
    entityIds: number[],
    relationshipName: string,
    newValue: number | null
  ) => {
    await queryClient.cancelQueries({ queryKey: ['getAllCalls'] });

    const previousData = queryClient.getQueryData([
      'getAllCalls',
      {
        page: apiPage,
        size: pageSize,
        sort: [`${sort},${order}`],
        ...filterParams,
      },
    ]);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const id of entityIds) {
        try {
          await handleRelationshipUpdate(id, relationshipName, newValue, true);
          successCount++;
        } catch (error) {
          console.error(`Failed to update entity ${id}:`, error);
          errorCount++;
        }
      }

      if (successCount > 0) {
        const action = newValue === null ? 'cleared' : 'updated';
        callToast.custom.success(
          `🔗 Bulk ${action.charAt(0).toUpperCase() + action.slice(1)}!`,
          `${relationshipName} ${action} for ${successCount} item${successCount > 1 ? 's' : ''}`
        );
      }

      if (errorCount === entityIds.length) {
        throw new Error(`All ${errorCount} updates failed`);
      } else if (errorCount > 0) {
        callToast.custom.warning(
          '⚠️ Partial Success',
          `${successCount} updated, ${errorCount} failed`
        );
      }
    } catch (error) {
      if (previousData) {
        queryClient.setQueryData(
          [
            'getAllCalls',
            {
              page: apiPage,
              size: pageSize,
              sort: [`${sort},${order}`],
              ...filterParams,
            },
          ],
          previousData
        );
      }
      throw error;
    }
  };

  const relationshipConfigs = [
    {
      name: 'priority',
      displayName: 'Priority',
      options: priorityOptions || [],
      displayField: 'name',
      isEditable: true,
    },

    {
      name: 'callType',
      displayName: 'CallType',
      options: calltypeOptions || [],
      displayField: 'name',
      isEditable: false,
    },

    {
      name: 'subCallType',
      displayName: 'SubCallType',
      options: subcalltypeOptions || [],
      displayField: 'name',
      isEditable: false,
    },

    {
      name: 'source',
      displayName: 'Source',
      options: sourceOptions || [],
      displayField: 'name',
      isEditable: false,
    },

    {
      name: 'customer',
      displayName: 'Customer',
      options: customerOptions || [],
      displayField: 'customerBusinessName',
      isEditable: false,
    },

    {
      name: 'product',
      displayName: 'Product',
      options: productOptions || [],
      displayField: 'name',
      isEditable: false,
    },

    {
      name: 'channelType',
      displayName: 'ChannelType',
      options: channeltypeOptions || [],
      displayField: 'name',
      isEditable: false,
    },

    {
      name: 'channelParties',
      displayName: 'ChannelParties',
      options: userprofileOptions || [],
      displayField: 'displayName',
      isEditable: false,
    },

    {
      name: 'assignedTo',
      displayName: 'AssignedTo',
      options: assignedToOptions || [],
      displayField: 'email',
      isEditable: true,
    },

    {
      name: 'callStatus',
      displayName: 'CallStatus',
      options: callstatusOptions || [],
      displayField: 'name',
      isEditable: false,
    },
  ];

  const hasActiveFilters =
    Object.keys(filters).length > 0 ||
    Boolean(searchTerm) ||
    Boolean(dateRange.from) ||
    Boolean(dateRange.to);
  const isAllSelected =
    filteredData && filteredData.length > 0 && selectedRows.size === filteredData.length;
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < (filteredData?.length || 0);

  const shouldDelayRender =
    !isColumnVisibilityLoaded ||
    (activeStatusTab === 'external' && !isExternalColumnVisibilityLoaded);

  if (shouldDelayRender) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: tableScrollStyles }} />
        <div className="w-full space-y-4">
          <div className="flex items-center justify-center h-32">
            <div className="text-center">
              <div className="text-muted-foreground">Loading table configuration...</div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: tableScrollStyles }} />
      <div className="w-full space-y-4">
        {/* Status Filter Tabs */}
        <Tabs value={activeStatusTab} onValueChange={setActiveStatusTab}>
          <TabsList className="w-full overflow-x-auto bg-gray-100 p-1 rounded-lg flex gap-2">
            <TabsTrigger
              value="crm-leads"
              className="flex items-center gap-2 whitespace-nowrap flex-shrink-0 data-[state=active]:bg-sky-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <div className="w-2 h-2 bg-sky-500 data-[state=active]:bg-white rounded-full"></div>
              CRM Leads
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="whitespace-nowrap flex-shrink-0 data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              All
            </TabsTrigger>
            <TabsTrigger
              value="business-partners"
              className="flex items-center gap-2 whitespace-nowrap flex-shrink-0 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <div className="w-2 h-2 bg-blue-500 data-[state=active]:bg-white rounded-full"></div>
              Business Partner
            </TabsTrigger>
            <TabsTrigger
              value="external"
              className="flex items-center gap-2 whitespace-nowrap flex-shrink-0 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <div className="w-2 h-2 bg-indigo-500 data-[state=active]:bg-white rounded-full"></div>
              External Leads
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="flex items-center gap-2 whitespace-nowrap flex-shrink-0 data-[state=active]:bg-green-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <div className="w-2 h-2 bg-green-500 data-[state=active]:bg-white rounded-full"></div>
              Active
            </TabsTrigger>
            <TabsTrigger
              value="draft"
              className="flex items-center gap-2 whitespace-nowrap flex-shrink-0 data-[state=active]:bg-yellow-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <div className="w-2 h-2 bg-yellow-500 data-[state=active]:bg-white rounded-full"></div>
              Draft
            </TabsTrigger>
            <TabsTrigger
              value="archived"
              className="flex items-center gap-2 whitespace-nowrap flex-shrink-0 data-[state=active]:bg-red-600 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              <div className="w-2 h-2 bg-red-500 data-[state=active]:bg-white rounded-full"></div>
              Archive
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Table Controls */}
        <div className="table-container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2 sm:mt-3 w-full">
          <div className="flex flex-wrap items-center gap-2">
            {/* Column Visibility Toggle */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-xs sm:text-sm">
                  <Settings2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Columns</span>
                  <span className="sm:hidden">Cols</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuLabel>Toggle Columns</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {ALL_COLUMNS.map((column) => {
                  const isVisible = getColumnVisibilityForCurrentTab(column.id);
                  const isLocked = isColumnVisibilityLocked(column.id);

                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={isVisible}
                      disabled={isLocked}
                      onCheckedChange={() => toggleColumnVisibility(column.id)}
                      onSelect={(e) => e.preventDefault()}
                      className={`flex items-center gap-2 ${isLocked ? 'opacity-60' : ''}`}
                    >
                      {isVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      {column.label}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Export Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="gap-2 text-xs sm:text-sm"
              disabled={!filteredData || filteredData.length === 0}
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Export CSV</span>
              <span className="sm:hidden">CSV</span>
            </Button>
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              Clear All Filters
            </Button>
          )}
        </div>

        {/* Bulk Actions */}
        {selectedRows.size > 0 && (
          <div className="table-container flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">
              {selectedRows.size} item{selectedRows.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex flex-wrap gap-2 sm:ml-auto">
              {relationshipConfigs.some((config) => config.isEditable) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBulkRelationshipDialog(true)}
                  className="gap-2"
                >
                  Assign Associations
                </Button>
              )}

              {/* Bulk Status Change Dropdown */}
              <Select onValueChange={(status) => handleBulkStatusChange(status)}>
                <SelectTrigger className="w-auto">
                  <SelectValue
                    placeholder={
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Change Status
                      </div>
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-green-600" />
                      Set {transformEnumValue('ACTIVE')}
                    </div>
                  </SelectItem>

                  <SelectItem value="ARCHIVED">
                    <div className="flex items-center gap-2">
                      <Archive className="h-4 w-4 text-red-600" />
                      {transformEnumValue('ARCHIVED')}
                    </div>
                  </SelectItem>
                  {TABLE_CONFIG.showDraftTab && (
                    <SelectItem value="DRAFT">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border border-gray-400 rounded" />
                        Set {transformEnumValue('DRAFT')}
                      </div>
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>

              {activeStatusTab !== 'archived' && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkArchive}
                  className="gap-2"
                >
                  <Archive className="h-4 w-4" />
                  Archive Selected
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Data Table */}
        <div className="table-container overflow-hidden rounded-md border bg-white shadow-sm">
          <div className="table-scroll overflow-x-auto">
            <Table className="w-full">
              <CallTableHeader
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
                    <TableCell colSpan={visibleColumns.length + 2} className="h-24 text-center">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredData?.length ? (
                  filteredData.map((call) => (
                    <CallTableRow
                      key={call.id}
                      call={call}
                      onArchive={handleArchive}
                      onStatusChange={handleStatusChange}
                      isUpdatingStatus={isUpdatingStatus}
                      statusOptions={statusOptions}
                      isSelected={selectedRows.has(call.id || 0)}
                      onSelect={handleSelectRow}
                      relationshipConfigs={relationshipConfigs}
                      onRelationshipUpdate={handleRelationshipUpdate}
                      updatingCells={updatingCells}
                      latestRemarksMap={latestRemarksMap}
                      isLatestRemarksLoading={isLatestRemarksLoading}
                      visibleColumns={visibleColumns}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + 2} className="h-24 text-center">
                      No calls found
                      {hasActiveFilters && (
                        <div className="text-sm text-muted-foreground mt-1">
                          Try adjusting your filters
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Advanced Pagination */}
        <div className="table-container">
          <AdvancedPagination
            currentPage={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            isLoading={isLoading}
            pageSizeOptions={[10, 25, 50, 100]}
            showPageSizeSelector={true}
            showPageInput={true}
            showItemsInfo={true}
            showFirstLastButtons={true}
            maxPageButtons={7}
          />
        </div>

        {/* Bulk Archive Dialog */}
        <AlertDialog open={showBulkArchiveDialog} onOpenChange={setShowBulkArchiveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Archive {selectedRows.size} item{selectedRows.size > 1 ? 's' : ''}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will change the status of the selected calls to "Archived". They will no longer
                appear in the active view but can be restored later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkArchive}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Status Change Dialog */}
        <AlertDialog open={showBulkStatusChangeDialog} onOpenChange={setShowBulkStatusChangeDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Change Status for {selectedRows.size} item{selectedRows.size > 1 ? 's' : ''}?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will update the status of the selected calls to "
                {statusOptions.find((opt) => opt.value.includes(bulkNewStatus || ''))?.label ||
                  bulkNewStatus}
                ".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmBulkStatusChange}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Update Status
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Archive Dialog */}
        <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive this call?</AlertDialogTitle>
              <AlertDialogDescription>
                This will change the status to "Archived". The call will no longer appear in the
                active view but can be restored later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmArchive}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Status Change Dialog */}
        <AlertDialog open={showStatusChangeDialog} onOpenChange={setShowStatusChangeDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Change Status</AlertDialogTitle>
              <AlertDialogDescription>
                Change the status of this call to "
                {statusOptions.find((opt) => opt.value.includes(newStatus || ''))?.label ||
                  newStatus}
                "?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmStatusChange}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                Update Status
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Bulk Relationship Assignment Dialog */}
        <BulkRelationshipAssignment
          open={showBulkRelationshipDialog}
          onOpenChange={setShowBulkRelationshipDialog}
          selectedEntityIds={Array.from(selectedRows)}
          relationshipConfigs={relationshipConfigs}
          onBulkUpdate={handleBulkRelationshipUpdate}
        />
      </div>
    </>
  );
}
