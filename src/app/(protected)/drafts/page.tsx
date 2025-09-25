'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import {
  Search,
  Trash2,
  FileText,
  Calendar,
  RefreshCw,
  Loader2,
  Archive,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Download,
  X,
  Settings2,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { useEntityDrafts, type DraftItem, type DraftData } from '@/core/hooks/use-entity-drafts';
import {
  useGetAllUserDrafts,
  useDeleteUserDraft,
  useCountUserDrafts,
} from '@/core/api/generated/spring/endpoints/user-draft-resource/user-draft-resource.gen';
import { UserDraftDTOStatus } from '@/core/api/generated/spring/schemas/UserDraftDTOStatus';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

// Entity route mapping for draft restoration
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
  // Add more entity types as needed
};

// Column configuration for the drafts table
interface ColumnConfig {
  id: string;
  label: string;
  accessor: string;
  visible: boolean;
  sortable: boolean;
}

const ALL_COLUMNS: ColumnConfig[] = [
  { id: 'id', label: 'ID', accessor: 'id', visible: true, sortable: true },
  { id: 'entityType', label: 'Entity Type', accessor: 'entityType', visible: true, sortable: true },
  { id: 'leadNo', label: 'Lead No', accessor: 'leadNo', visible: true, sortable: false },
  { id: 'step', label: 'Step', accessor: 'currentStep', visible: true, sortable: true },
  {
    id: 'lastModified',
    label: 'Last Modified',
    accessor: 'lastModifiedDate',
    visible: true,
    sortable: true,
  },
  { id: 'created', label: 'Created', accessor: 'createdDate', visible: false, sortable: true },
];

// Local storage key for column visibility
const COLUMN_VISIBILITY_KEY = 'drafts-table-columns';

// Define sort ordering constants
const ASC = 'asc';
const DESC = 'desc';

// Helper function to get leadNo from draft data
const getLeadNoFromDraft = (draft: DraftItem & { entityType: string }): string | null => {
  if (draft.entityType.toLowerCase() === 'call' && draft.data.formData?.leadNo) {
    return draft.data.formData.leadNo;
  }
  return null;
};

// Helper function to format leadNo for display
const formatLeadNoDisplay = (leadNo: string): string => {
  if (leadNo && leadNo.length === 8 && /^[A-Z]{3}\d{5}$/.test(leadNo)) {
    return `${leadNo.substring(0, 3)}-${leadNo.substring(3)}`;
  }
  return leadNo;
};

export default function DraftsManagementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [draftToDelete, setDraftToDelete] = useState<(DraftItem & { entityType: string }) | null>(
    null
  );
  const [activeStatusTab, setActiveStatusTab] = useState<string>('active');
  const [sort, setSort] = useState('lastModifiedDate');
  const [order, setOrder] = useState(DESC);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY);
        return saved
          ? JSON.parse(saved)
          : ALL_COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: col.visible }), {});
      } catch {
        return ALL_COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: col.visible }), {});
      }
    }
    return ALL_COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: col.visible }), {});
  });

  // Save column visibility to localStorage
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility));
      } catch (error) {
        console.warn('Failed to save column visibility to localStorage:', error);
      }
    }
  }, [columnVisibility]);

  // Get visible columns
  const visibleColumns = useMemo(() => {
    return ALL_COLUMNS.filter((col) => columnVisibility[col.id] !== false);
  }, [columnVisibility]);

  // Toggle column visibility
  const toggleColumnVisibility = (columnId: string) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };

  // Get all drafts without entity type filter first to see what types exist
  const {
    data: allDraftsResponse,
    isLoading: isLoadingAllDrafts,
    error: allDraftsError,
  } = useGetAllUserDrafts(
    {
      // No filters to get all drafts - use empty object
      size: 100, // Get more drafts for management page
      sort: ['lastModifiedDate,desc'], // Sort by most recent first
    },
    {
      query: {
        enabled: true,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
      },
    }
  );

  // Delete draft mutation
  const deleteDraftMutation = useDeleteUserDraft({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ['/api/user-drafts'],
        });
        toast.success('Draft deleted successfully');
      },
      onError: (error: any) => {
        console.error('Failed to delete draft:', error);
        // Handle 409 conflicts gracefully
        if (error?.response?.status === 409 || error?.status === 409) {
          toast.success('Draft was already deleted');
          // Refresh the list to sync with server state
          queryClient.invalidateQueries({
            queryKey: ['/api/user-drafts'],
          });
        } else {
          toast.error('Failed to delete draft');
        }
      },
    },
  });

  // Transform response to DraftItem[] with entity type
  const allDrafts: (DraftItem & { entityType: string })[] = allDraftsResponse
    ? allDraftsResponse.map((draft) => {
        const draftData = JSON.parse(draft.jsonPayload) as DraftData;
        return {
          id: draft.id!,
          data: draftData,
          createdDate: draft.createdDate,
          lastModifiedDate: draft.lastModifiedDate,
          entityType: draftData.entityType,
        };
      })
    : [];

  const isLoadingAny = isLoadingAllDrafts;

  // Filter drafts based on search and entity type
  const filteredDrafts = allDrafts.filter((draft) => {
    const matchesSearch =
      draft.data.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      draft.id.toString().includes(searchQuery);
    const matchesEntityType =
      selectedEntityType === 'all' || draft.entityType === selectedEntityType;
    return matchesSearch && matchesEntityType;
  });

  // Sort drafts by most recent first
  const sortedDrafts = filteredDrafts.sort(
    (a, b) =>
      new Date(b.lastModifiedDate || b.createdDate || '').getTime() -
      new Date(a.lastModifiedDate || a.createdDate || '').getTime()
  );

  const handleRestoreDraft = (draft: DraftItem & { entityType: string }) => {
    const route = ENTITY_ROUTES[draft.entityType];
    if (!route) {
      toast.error(`No route found for entity type: ${draft.entityType}`);
      return;
    }

    // Store draft restoration info for the target form
    const restorationData = {
      draftId: draft.id,
      entityType: draft.entityType,
      formData: draft.data.formData,
      currentStep: draft.data.currentStep || 0,
      timestamp: Date.now(),
    };

    sessionStorage.setItem('draftToRestore', JSON.stringify(restorationData));

    // Navigate to the form
    router.push(route);
    toast.success(`Navigating to restore ${draft.entityType} draft...`);
  };

  const handleDeleteDraft = async (draft: DraftItem & { entityType: string }) => {
    setDraftToDelete(draft);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteDraft = async () => {
    if (!draftToDelete) return;

    try {
      await deleteDraftMutation.mutateAsync({ id: draftToDelete.id });
    } catch (error) {
      // Error handling is done in the mutation
    }

    setDeleteDialogOpen(false);
    setDraftToDelete(null);
  };

  const getStepText = (currentStep?: number) => {
    if (currentStep === undefined) return 'Unknown step';
    return `Step ${currentStep + 1}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const getEntityColor = (entityType: string) => {
    const colors: Record<string, string> = {
      Call: 'bg-blue-100 text-blue-800',
      Customer: 'bg-green-100 text-green-800',
      Meeting: 'bg-purple-100 text-purple-800',
      Source: 'bg-orange-100 text-orange-800',
      Priority: 'bg-red-100 text-red-800',
      CallType: 'bg-yellow-100 text-yellow-800',
      SubCallType: 'bg-pink-100 text-pink-800',
      CallCategory: 'bg-indigo-100 text-indigo-800',
      CallStatus: 'bg-gray-100 text-gray-800',
      ChannelType: 'bg-teal-100 text-teal-800',
      UserProfile: 'bg-cyan-100 text-cyan-800',
    };
    return colors[entityType] || 'bg-gray-100 text-gray-800';
  };

  // Get unique entity types from actual drafts for filter
  const availableEntityTypes = [...new Set(allDrafts.map((draft) => draft.entityType))].sort();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Drafts</h1>
          <p className="text-muted-foreground">Manage your saved form drafts across all entities</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="px-3 py-1">
            {sortedDrafts.length} draft{sortedDrafts.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search drafts by entity type or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={selectedEntityType}
                onChange={(e) => setSelectedEntityType(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="all">All Entity Types</option>
                {availableEntityTypes.map((entityType) => (
                  <option key={entityType} value={entityType}>
                    {entityType}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drafts Grid */}
      {isLoadingAny ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading drafts...
          </div>
        </div>
      ) : sortedDrafts.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No drafts found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedEntityType !== 'all'
                  ? 'Try adjusting your search filters'
                  : "You haven't saved any form drafts yet"}
              </p>
              {(searchQuery || selectedEntityType !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedEntityType('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedDrafts.map((draft) => (
            <Card
              key={`${draft.entityType}-${draft.id}`}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Draft #{draft.id}</CardTitle>
                  <Badge className={getEntityColor(draft.entityType)}>{draft.entityType}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Saved {formatDate(draft.lastModifiedDate || draft.createdDate)}
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {getStepText(draft.data.currentStep)}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => handleRestoreDraft(draft)} className="flex-1">
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteDraft(draft)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {draftToDelete?.entityType} draft? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteDraft}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
