'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { handleMeetingError, meetingToast } from './meeting-toast';
import { MeetingDTOStatus } from '@/core/api/generated/spring/schemas/MeetingDTOStatus';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Archive,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
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
  useCountMeetings,
  useGetAllMeetings,
  useSearchMeetings,
  useUpdateMeeting,
} from '@/core/api/generated/spring/endpoints/meeting-resource/meeting-resource.gen';

import { useGetAllUserProfiles } from '@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen';

import { useGetAllCustomers } from '@/core/api/generated/spring/endpoints/customer-resource/customer-resource.gen';

import { useGetAllCalls } from '@/core/api/generated/spring/endpoints/call-resource/call-resource.gen';
import { MeetingTableHeader } from './table/meeting-table-header';
import { MeetingTableRow } from './table/meeting-table-row';
import { BulkRelationshipAssignment } from './table/bulk-relationship-assignment';
import { AdvancedPagination, usePaginationState } from './table/advanced-pagination';

const TABLE_CONFIG = {
  showDraftTab: false,
  centerAlignActions: true,
};

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
    max-width: calc(100vw - 2rem);
  }
  @media (min-width: 1024px) {
    .table-container {
      max-width: calc(100vw - 20rem);
    }
  }
`;

const ASC = 'asc';
const DESC = 'desc';

interface ColumnConfig {
  id: string;
  label: string;
  accessor: string;
  type: 'field' | 'relationship';
  visible: boolean;
  sortable: boolean;
}

const ALL_COLUMNS: ColumnConfig[] = [
  {
    id: 'id',
    label: 'ID',
    accessor: 'id',
    type: 'field',
    visible: true,
    sortable: true,
  },

  {
    id: 'meetingDateTime',
    label: 'Meeting Date Time',
    accessor: 'meetingDateTime',
    type: 'field',
    visible: true,
    sortable: true,
  },

  {
    id: 'duration',
    label: 'Duration',
    accessor: 'duration',
    type: 'field',
    visible: true,
    sortable: true,
  },

  {
    id: 'title',
    label: 'Title',
    accessor: 'title',
    type: 'field',
    visible: true,
    sortable: true,
  },

  {
    id: 'description',
    label: 'Description',
    accessor: 'description',
    type: 'field',
    visible: true,
    sortable: true,
  },

  {
    id: 'meetingUrl',
    label: 'Meeting Url',
    accessor: 'meetingUrl',
    type: 'field',
    visible: true,
    sortable: true,
  },

  {
    id: 'googleCalendarEventId',
    label: 'Google Calendar Event Id',
    accessor: 'googleCalendarEventId',
    type: 'field',
    visible: true,
    sortable: true,
  },

  {
    id: 'notes',
    label: 'Notes',
    accessor: 'notes',
    type: 'field',
    visible: true,
    sortable: true,
  },

  {
    id: 'isRecurring',
    label: 'Is Recurring',
    accessor: 'isRecurring',
    type: 'field',
    visible: true,
    sortable: true,
  },

  {
    id: 'timeZone',
    label: 'Time Zone',
    accessor: 'timeZone',
    type: 'field',
    visible: true,
    sortable: true,
  },

  {
    id: 'meetingStatus',
    label: 'Meeting Status',
    accessor: 'meetingStatus',
    type: 'field',
    visible: true,
    sortable: true,
  },

  {
    id: 'meetingType',
    label: 'Meeting Type',
    accessor: 'meetingType',
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
    id: 'createdAt',
    label: 'Created At',
    accessor: 'createdAt',
    type: 'field',
    visible: true,
    sortable: true,
  },

  {
    id: 'updatedAt',
    label: 'Updated At',
    accessor: 'updatedAt',
    type: 'field',
    visible: true,
    sortable: true,
  },

  {
    id: 'organizer',
    label: 'Organizer',
    accessor: 'organizer',
    type: 'relationship',
    visible: true,
    sortable: false,
  },

  {
    id: 'assignedCustomer',
    label: 'Assigned Customer',
    accessor: 'assignedCustomer',
    type: 'relationship',
    visible: true,
    sortable: false,
  },

  {
    id: 'call',
    label: 'Call',
    accessor: 'call',
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
];

const COLUMN_VISIBILITY_KEY = 'meeting-table-columns';

interface FilterState {
  [key: string]: string | string[] | Date | undefined;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export function MeetingTable() {
  const queryClient = useQueryClient();

  const { page, pageSize, handlePageChange, handlePageSizeChange, resetPagination } =
    usePaginationState(1, 10);

  const [sort, setSort] = useState('id');
  const [order, setOrder] = useState(ASC);
  const [searchTerm, setSearchTerm] = useState('');
  const [archiveId, setArchiveId] = useState<number | null>(null);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [statusChangeId, setStatusChangeId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState<string | null>(null);
  const [showStatusChangeDialog, setShowStatusChangeDialog] = useState(false);
  const [activeStatusTab, setActiveStatusTab] = useState<string>('active');
  const [filters, setFilters] = useState<FilterState>({});
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showBulkArchiveDialog, setShowBulkArchiveDialog] = useState(false);
  const [showBulkStatusChangeDialog, setShowBulkStatusChangeDialog] = useState(false);
  const [bulkNewStatus, setBulkNewStatus] = useState<string | null>(null);
  const [showBulkRelationshipDialog, setShowBulkRelationshipDialog] = useState(false);

  const [updatingCells, setUpdatingCells] = useState<Set<string>>(new Set());

  const [isColumnVisibilityLoaded, setIsColumnVisibilityLoaded] = useState(false);

  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY);
      const oldKey = 'meeting-table-columns';

      if (saved) {
        setColumnVisibility(JSON.parse(saved));
      } else {
        const oldSaved = localStorage.getItem(oldKey);
        if (oldSaved) {
          localStorage.removeItem(oldKey);
        }

        const defaultVisibility = ALL_COLUMNS.reduce(
          (acc, col) => ({
            ...acc,
            [col.id]: col.visible,
          }),
          {}
        );
        setColumnVisibility(defaultVisibility);
      }
    } catch (error) {
      console.warn('Failed to load column visibility from localStorage:', error);

      const defaultVisibility = ALL_COLUMNS.reduce(
        (acc, col) => ({
          ...acc,
          [col.id]: col.visible,
        }),
        {}
      );
      setColumnVisibility(defaultVisibility);
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

  const visibleColumns = useMemo(() => {
    return ALL_COLUMNS.filter((col) => columnVisibility[col.id] !== false);
  }, [columnVisibility]);

  const toggleColumnVisibility = (columnId: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  const handleRefresh = async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey: ['getAllMeetings'],
        refetchType: 'active',
      });
      await queryClient.invalidateQueries({
        queryKey: ['countMeetings'],
        refetchType: 'active',
      });

      await queryClient.invalidateQueries({
        queryKey: ['searchMeetings'],
        refetchType: 'active',
      });

      await refetch();

      toast.success('Data refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error('Failed to refresh data');
    }
  };

  const exportToCSV = () => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = visibleColumns.map((col) => col.label);
    const csvContent = [
      headers.join(','),
      ...data.map((item) => {
        return visibleColumns
          .map((col) => {
            let value = '';
            if (col.type === 'field') {
              const fieldValue = item[col.accessor as keyof typeof item];
              value = fieldValue !== null && fieldValue !== undefined ? String(fieldValue) : '';
            } else if (col.type === 'relationship') {
              const relationship = item[col.accessor as keyof typeof item] as any;

              if (col.id === 'organizer' && relationship) {
                value = relationship.displayName || '';
              }

              if (col.id === 'assignedCustomer' && relationship) {
                value = relationship.customerBusinessName || '';
              }

              if (col.id === 'call' && relationship) {
                value = relationship.name || '';
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
    link.download = `meeting-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.success('Data exported successfully');
  };

  const apiPage = page - 1;

  const { data: userprofileOptions = [] } = useGetAllUserProfiles(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );

  const { data: customerOptions = [] } = useGetAllCustomers(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );

  const { data: callOptions = [] } = useGetAllCalls(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );

  const findEntityIdByName = (entities: any[], name: string, displayField: string = 'name') => {
    const entity = entities?.find((e) =>
      e[displayField]?.toLowerCase().includes(name.toLowerCase())
    );
    return entity?.id;
  };

  const statusOptions = [
    {
      value: MeetingDTOStatus.DRAFT,
      label: transformEnumValue('DRAFT'),
      color: 'bg-gray-100 text-gray-800',
    },
    {
      value: MeetingDTOStatus.ACTIVE,
      label: transformEnumValue('ACTIVE'),
      color: 'bg-green-100 text-green-800',
    },
    {
      value: MeetingDTOStatus.INACTIVE,
      label: transformEnumValue('INACTIVE'),
      color: 'bg-yellow-100 text-yellow-800',
    },
    {
      value: MeetingDTOStatus.ARCHIVED,
      label: transformEnumValue('ARCHIVED'),
      color: 'bg-red-100 text-red-800',
    },
  ];

  const getStatusFilter = () => {
    switch (activeStatusTab) {
      case 'draft':
        return { 'status.equals': MeetingDTOStatus.DRAFT };
      case 'active':
        return { 'status.equals': MeetingDTOStatus.ACTIVE };
      case 'inactive':
        return { 'status.equals': MeetingDTOStatus.INACTIVE };
      case 'archived':
        return { 'status.equals': MeetingDTOStatus.ARCHIVED };
      case 'all':
        return {};
      default:
        return { 'status.equals': MeetingDTOStatus.ACTIVE };
    }
  };

  const buildFilterParams = () => {
    const params: Record<string, any> = {
      ...getStatusFilter(),
    };

    const relationshipMappings = {
      'organizer.displayName': {
        apiParam: 'organizerId.equals',
        options: userprofileOptions,
        displayField: 'displayName',
      },

      'assignedCustomer.customerBusinessName': {
        apiParam: 'assignedCustomerId.equals',
        options: customerOptions,
        displayField: 'customerBusinessName',
      },

      'call.name': {
        apiParam: 'callId.equals',
        options: callOptions,
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
        } else if (key === 'isRecurring') {
          params['isRecurring.equals'] = value === 'true';
        } else if (key === 'meetingDateTime') {
          if (value instanceof Date) {
            params['meetingDateTime.equals'] = value.toISOString().split('T')[0];
          } else if (typeof value === 'string' && value.trim() !== '') {
            params['meetingDateTime.equals'] = value;
          }
        } else if (key === 'createdAt') {
          if (value instanceof Date) {
            params['createdAt.equals'] = value.toISOString().split('T')[0];
          } else if (typeof value === 'string' && value.trim() !== '') {
            params['createdAt.equals'] = value;
          }
        } else if (key === 'updatedAt') {
          if (value instanceof Date) {
            params['updatedAt.equals'] = value.toISOString().split('T')[0];
          } else if (typeof value === 'string' && value.trim() !== '') {
            params['updatedAt.equals'] = value;
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
        } else if (key === 'duration') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['duration.contains'] = value;
          }
        } else if (key === 'title') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['title.contains'] = value;
          }
        } else if (key === 'description') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['description.contains'] = value;
          }
        } else if (key === 'meetingUrl') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['meetingUrl.contains'] = value;
          }
        } else if (key === 'googleCalendarEventId') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['googleCalendarEventId.contains'] = value;
          }
        } else if (key === 'notes') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['notes.contains'] = value;
          }
        } else if (key === 'timeZone') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['timeZone.contains'] = value;
          }
        } else if (key === 'meetingStatus') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['meetingStatus.contains'] = value;
          }
        } else if (key === 'meetingType') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['meetingType.contains'] = value;
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
        } else if (Array.isArray(value) && value.length > 0) {
          params[key] = value;
        } else if (typeof value === 'string' && value.trim() !== '') {
          params[`${key}.contains`] = value;
        }
      }
    });

    if (dateRange.from) {
      params['meetingDateTime.greaterThanOrEqual'] = dateRange.from.toISOString();
    }
    if (dateRange.to) {
      params['meetingDateTime.lessThanOrEqual'] = dateRange.to.toISOString();
    }

    if (dateRange.from) {
      params['createdAt.greaterThanOrEqual'] = dateRange.from.toISOString();
    }
    if (dateRange.to) {
      params['createdAt.lessThanOrEqual'] = dateRange.to.toISOString();
    }

    if (dateRange.from) {
      params['updatedAt.greaterThanOrEqual'] = dateRange.from.toISOString();
    }
    if (dateRange.to) {
      params['updatedAt.lessThanOrEqual'] = dateRange.to.toISOString();
    }

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

    return params;
  };

  const filterParams = buildFilterParams();

  const { data, isLoading, refetch } = searchTerm
    ? useSearchMeetings(
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
    : useGetAllMeetings(
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

  const { data: countData } = useCountMeetings(filterParams, {
    query: {
      enabled: true,
      staleTime: 0,
      refetchOnWindowFocus: true,
    },
  });

  const { mutate: updateEntity, isPending: isUpdating } = useUpdateMeeting({
    mutation: {
      onMutate: async (variables) => {
        await queryClient.cancelQueries({
          queryKey: ['getAllMeetings'],
        });

        await queryClient.cancelQueries({
          queryKey: ['searchMeetings'],
        });

        const previousData = queryClient.getQueryData([
          'getAllMeetings',
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
              'getAllMeetings',
              {
                page: apiPage,
                size: pageSize,
                sort: [`${sort},${order}`],
                ...filterParams,
              },
            ],
            (old: any[]) =>
              old.map((meeting) =>
                meeting.id === variables.id ? { ...meeting, ...variables.data } : meeting
              )
          );
        }

        if (searchTerm) {
          queryClient.setQueryData(
            [
              'searchMeetings',
              {
                query: searchTerm,
                page: apiPage,
                size: pageSize,
                sort: [`${sort},${order}`],
                ...filterParams,
              },
            ],
            (old: any[]) =>
              old?.map((meeting) =>
                meeting.id === variables.id ? { ...meeting, ...variables.data } : meeting
              )
          );
        }

        return { previousData };
      },
      onSuccess: (data, variables) => {
        queryClient.setQueryData(
          [
            'getAllMeetings',
            {
              page: apiPage,
              size: pageSize,
              sort: [`${sort},${order}`],
              ...filterParams,
            },
          ],
          (old: any[]) => old?.map((meeting) => (meeting.id === variables.id ? data : meeting))
        );

        if (searchTerm) {
          queryClient.setQueryData(
            [
              'searchMeetings',
              {
                query: searchTerm,
                page: apiPage,
                size: pageSize,
                sort: [`${sort},${order}`],
                ...filterParams,
              },
            ],
            (old: any[]) => old?.map((meeting) => (meeting.id === variables.id ? data : meeting))
          );
        }

        meetingToast.updated();
      },
      onError: (error, variables, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(
            [
              'getAllMeetings',
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
        handleMeetingError(error);
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({
          queryKey: ['getAllMeetings'],
          refetchType: 'active',
        });
        await queryClient.invalidateQueries({
          queryKey: ['countMeetings'],
          refetchType: 'active',
        });

        await queryClient.invalidateQueries({
          queryKey: ['searchMeetings'],
          refetchType: 'active',
        });
      },
    },
  });

  const { mutate: updateEntityStatus, isPending: isUpdatingStatus } = useUpdateMeeting({
    mutation: {
      onMutate: async (variables) => {
        await queryClient.cancelQueries({ queryKey: ['getAllMeetings'] });

        const previousData = queryClient.getQueryData([
          'getAllMeetings',
          {
            page: apiPage,
            size: pageSize,
            sort: [`${sort},${order}`],
            ...filterParams,
          },
        ]);

        queryClient.setQueryData(
          [
            'getAllMeetings',
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
              return old.map((meeting) =>
                meeting.id === variables.id ? { ...meeting, ...variables.data } : meeting
              );
            } else {
              console.log(`Removing item ${variables.id} from current view`);
              return old.filter((meeting) => meeting.id !== variables.id);
            }
          }
        );

        return { previousData };
      },
      onSuccess: (data, variables) => {
        const statusLabel =
          statusOptions.find((opt) => opt.value.includes(variables.data.status))?.label ||
          variables.data.status;
        meetingToast.custom.success(`Status Updated`, `Meeting status changed to ${statusLabel}`);

        const currentFilter = getStatusFilter();
        const currentStatusFilter = currentFilter['status.equals'];
        const newStatus = variables.data.status;

        if (currentStatusFilter !== newStatus && activeStatusTab !== 'all') {
          console.log(
            `Updating count cache - removing 1 item due to status change from ${currentStatusFilter} to ${newStatus}`
          );
          queryClient.setQueryData(['countMeetings', filterParams], (old: number) =>
            Math.max(0, (old || 0) - 1)
          );
        }
      },
      onError: (error, variables, context) => {
        if (context?.previousData) {
          queryClient.setQueryData(
            [
              'getAllMeetings',
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
        handleMeetingError(error);
      },
      onSettled: async () => {
        await queryClient.invalidateQueries({
          queryKey: ['getAllMeetings'],
          refetchType: 'active',
        });
        await queryClient.invalidateQueries({
          queryKey: ['countMeetings'],
          refetchType: 'active',
        });

        await queryClient.invalidateQueries({
          queryKey: ['searchMeetings'],
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
      const currentEntity = data?.find((item) => item.id === archiveId);
      if (currentEntity) {
        updateEntityStatus({
          id: archiveId,
          data: { ...currentEntity, status: MeetingDTOStatus.ARCHIVED },
        });
      }
    }
    setShowArchiveDialog(false);
    setArchiveId(null);
  };

  const confirmStatusChange = () => {
    if (statusChangeId && newStatus) {
      const currentEntity = data?.find((item) => item.id === statusChangeId);
      if (currentEntity) {
        const statusValue = MeetingDTOStatus[newStatus as keyof typeof MeetingDTOStatus];
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

  const totalItems = countData || 0;
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
    if (data && selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else if (data) {
      setSelectedRows(
        new Set(data.map((item) => item.id).filter((id): id is number => id !== undefined))
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
    await queryClient.cancelQueries({ queryKey: ['getAllMeetings'] });

    const previousData = queryClient.getQueryData([
      'getAllMeetings',
      {
        page: apiPage,
        size: pageSize,
        sort: [`${sort},${order}`],
        ...filterParams,
      },
    ]);

    try {
      const updatePromises = Array.from(selectedRows).map(async (id) => {
        const currentEntity = data?.find((item) => item.id === id);
        if (currentEntity) {
          return new Promise<void>((resolve, reject) => {
            updateEntityStatus(
              {
                id,
                data: { ...currentEntity, status: MeetingDTOStatus.ARCHIVED },
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
        queryKey: ['getAllMeetings'],
        refetchType: 'active',
      });
      await queryClient.invalidateQueries({
        queryKey: ['countMeetings'],
        refetchType: 'active',
      });

      await queryClient.invalidateQueries({
        queryKey: ['searchMeetings'],
        refetchType: 'active',
      });

      meetingToast.custom.success(
        'Bulk Archive Complete',
        `${selectedRows.size} item${selectedRows.size > 1 ? 's' : ''} archived successfully`
      );
      setSelectedRows(new Set());
    } catch (error) {
      if (previousData) {
        queryClient.setQueryData(
          [
            'getAllMeetings',
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
      meetingToast.custom.error(
        'Bulk Archive Failed',
        'Some items could not be archived. Please try again.'
      );
    }
    setShowBulkArchiveDialog(false);
  };

  const confirmBulkStatusChange = async () => {
    if (!bulkNewStatus) return;

    await queryClient.cancelQueries({ queryKey: ['getAllMeetings'] });

    const previousData = queryClient.getQueryData([
      'getAllMeetings',
      {
        page: apiPage,
        size: pageSize,
        sort: [`${sort},${order}`],
        ...filterParams,
      },
    ]);

    try {
      const statusValue = MeetingDTOStatus[bulkNewStatus as keyof typeof MeetingDTOStatus];
      const updatePromises = Array.from(selectedRows).map(async (id) => {
        const currentEntity = data?.find((item) => item.id === id);
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
        queryKey: ['getAllMeetings'],
        refetchType: 'active',
      });
      await queryClient.invalidateQueries({
        queryKey: ['countMeetings'],
        refetchType: 'active',
      });

      await queryClient.invalidateQueries({
        queryKey: ['searchMeetings'],
        refetchType: 'active',
      });

      const statusLabel =
        statusOptions.find((opt) => opt.value.includes(bulkNewStatus))?.label || bulkNewStatus;
      meetingToast.custom.success(
        'Bulk Status Update Complete',
        `${selectedRows.size} item${selectedRows.size > 1 ? 's' : ''} updated to ${statusLabel}`
      );
      setSelectedRows(new Set());
    } catch (error) {
      if (previousData) {
        queryClient.setQueryData(
          [
            'getAllMeetings',
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
      meetingToast.custom.error(
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
      const currentEntity = data?.find((item) => item.id === entityId);
      if (!currentEntity) {
        setUpdatingCells((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cellKey);
          return newSet;
        });
        reject(new Error('Meeting not found in current data'));
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
                  'getAllMeetings',
                  {
                    page: apiPage,
                    size: pageSize,
                    sort: [`${sort},${order}`],
                    ...filterParams,
                  },
                ],
                (old: any[]) =>
                  old?.map((meeting) => (meeting.id === entityId ? serverResponse : meeting))
              );

              if (searchTerm) {
                queryClient.setQueryData(
                  [
                    'searchMeetings',
                    {
                      query: searchTerm,
                      page: apiPage,
                      size: pageSize,
                      sort: [`${sort},${order}`],
                      ...filterParams,
                    },
                  ],
                  (old: any[]) =>
                    old?.map((meeting) => (meeting.id === entityId ? serverResponse : meeting))
                );
              }
            }

            if (!isBulkOperation) {
              meetingToast.relationshipUpdated(relationshipName);
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
    await queryClient.cancelQueries({ queryKey: ['getAllMeetings'] });

    const previousData = queryClient.getQueryData([
      'getAllMeetings',
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
        meetingToast.custom.success(
          `🔗 Bulk ${action.charAt(0).toUpperCase() + action.slice(1)}!`,
          `${relationshipName} ${action} for ${successCount} item${successCount > 1 ? 's' : ''}`
        );
      }

      if (errorCount === entityIds.length) {
        throw new Error(`All ${errorCount} updates failed`);
      } else if (errorCount > 0) {
        meetingToast.custom.warning(
          '⚠️ Partial Success',
          `${successCount} updated, ${errorCount} failed`
        );
      }
    } catch (error) {
      if (previousData) {
        queryClient.setQueryData(
          [
            'getAllMeetings',
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
      name: 'organizer',
      displayName: 'Organizer',
      options: userprofileOptions || [],
      displayField: 'displayName',
      isEditable: false,
    },

    {
      name: 'assignedCustomer',
      displayName: 'AssignedCustomer',
      options: customerOptions || [],
      displayField: 'customerBusinessName',
      isEditable: false,
    },

    {
      name: 'call',
      displayName: 'Call',
      options: callOptions || [],
      displayField: 'name',
      isEditable: false,
    },
  ];

  const hasActiveFilters =
    Object.keys(filters).length > 0 ||
    Boolean(searchTerm) ||
    Boolean(dateRange.from) ||
    Boolean(dateRange.to);
  const isAllSelected = data && data.length > 0 && selectedRows.size === data.length;
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < (data?.length || 0);

  if (!isColumnVisibilityLoaded) {
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
          <TabsList
            className={`grid w-full ${TABLE_CONFIG.showDraftTab ? 'grid-cols-5' : 'grid-cols-4'}`}
          >
            <TabsTrigger value="active" className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Active
            </TabsTrigger>
            <TabsTrigger value="inactive" className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              Inactive
            </TabsTrigger>
            <TabsTrigger value="archived" className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              Archived
            </TabsTrigger>
            {TABLE_CONFIG.showDraftTab && (
              <TabsTrigger value="draft" className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                Draft
              </TabsTrigger>
            )}
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Table Controls */}
        <div className="table-container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                {ALL_COLUMNS.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={columnVisibility[column.id] !== false}
                    onCheckedChange={() => toggleColumnVisibility(column.id)}
                    onSelect={(e) => e.preventDefault()}
                    className="flex items-center gap-2"
                  >
                    {columnVisibility[column.id] !== false ? (
                      <Eye className="h-4 w-4" />
                    ) : (
                      <EyeOff className="h-4 w-4" />
                    )}
                    {column.label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Refresh Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-2 text-xs sm:text-sm"
              disabled={isLoading}
            >
              <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
              <span className="sm:hidden">⟳</span>
            </Button>

            {/* Export Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="gap-2 text-xs sm:text-sm"
              disabled={!data || data.length === 0}
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
                  <SelectItem value="INACTIVE">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      Set {transformEnumValue('INACTIVE')}
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
            <Table className="w-full min-w-[600px]">
              <MeetingTableHeader
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
                ) : data?.length ? (
                  data.map((meeting) => (
                    <MeetingTableRow
                      key={meeting.id}
                      meeting={meeting}
                      onArchive={handleArchive}
                      onStatusChange={handleStatusChange}
                      isUpdatingStatus={isUpdatingStatus}
                      statusOptions={statusOptions}
                      isSelected={selectedRows.has(meeting.id || 0)}
                      onSelect={handleSelectRow}
                      relationshipConfigs={relationshipConfigs}
                      onRelationshipUpdate={handleRelationshipUpdate}
                      updatingCells={updatingCells}
                      visibleColumns={visibleColumns}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={visibleColumns.length + 2} className="h-24 text-center">
                      No meetings found
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
                This will change the status of the selected meetings to "Archived". They will no
                longer appear in the active view but can be restored later.
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
                This will update the status of the selected meetings to "
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
              <AlertDialogTitle>Archive this meeting?</AlertDialogTitle>
              <AlertDialogDescription>
                This will change the status to "Archived". The meeting will no longer appear in the
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
                Change the status of this meeting to "
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
