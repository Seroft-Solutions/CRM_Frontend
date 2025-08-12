'use client';

import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import {
  Plus,
  Calendar,
  Video,
  Phone,
  MapPin,
  User,
  Clock,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Eye,
  X,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

import {
  useGetAllMeetings,
  useUpdateMeeting,
} from '@/core/api/generated/spring/endpoints/meeting-resource/meeting-resource.gen';
import {
  MeetingDTOMeetingStatus,
  MeetingDTOMeetingType,
} from '@/core/api/generated/spring/schemas';
import type { MeetingDTO } from '@/core/api/generated/spring/schemas/MeetingDTO';

interface CallMeetingsSectionProps {
  callId: number;
  customerId?: number;
  assignedUserId?: number | string;
}

export function CallMeetingsSection({
  callId,
  customerId,
  assignedUserId,
}: CallMeetingsSectionProps) {
  const router = useRouter();

  // State management
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingDTO | null>(null);

  // Table state
  const [sorting, setSorting] = useState<SortingState>([{ id: 'meetingDateTime', desc: false }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  // Fetch meetings for this specific call
  const {
    data: meetings = [],
    isLoading,
    refetch,
  } = useGetAllMeetings(
    {
      'callId.equals': callId,
      sort: ['meetingDateTime,asc'],
    },
    {
      query: {
        enabled: !!callId,
      },
    }
  );

  // Cancel meeting mutation
  const { mutate: updateMeeting, isPending: isCancelling } = useUpdateMeeting({
    mutation: {
      onSuccess: () => {
        toast.success('Meeting cancelled successfully');
        setShowCancelDialog(false);
        setSelectedMeeting(null);
        refetch();
      },
      onError: (error) => {
        toast.error(`Failed to cancel meeting: ${error}`);
      },
    },
  });

  // Action handlers
  const handleScheduleNewMeeting = () => {
    const params = new URLSearchParams();
    if (customerId) params.set('customerId', customerId.toString());
    if (assignedUserId) params.set('assignedUserId', assignedUserId.toString());
    if (callId) params.set('callId', callId.toString());

    router.push(`/calls/schedule-meeting?${params.toString()}`);
  };

  const handleCancelMeeting = () => {
    if (!selectedMeeting) return;

    updateMeeting({
      id: selectedMeeting.id!,
      data: {
        ...selectedMeeting,
        meetingStatus: MeetingDTOMeetingStatus.CANCELLED,
      },
    });
  };

  const openDetailsDialog = (meeting: MeetingDTO) => {
    setSelectedMeeting(meeting);
    setShowDetailsDialog(true);
  };

  const openCancelDialog = (meeting: MeetingDTO) => {
    setSelectedMeeting(meeting);
    setShowCancelDialog(true);
  };

  const getMeetingStatusBadge = (status: string) => {
    const statusConfig = {
      [MeetingDTOMeetingStatus.SCHEDULED]: { label: 'Scheduled', variant: 'default' as const },
      [MeetingDTOMeetingStatus.CONFIRMED]: { label: 'Confirmed', variant: 'default' as const },
      [MeetingDTOMeetingStatus.CANCELLED]: { label: 'Cancelled', variant: 'destructive' as const },
      [MeetingDTOMeetingStatus.COMPLETED]: { label: 'Completed', variant: 'secondary' as const },
      [MeetingDTOMeetingStatus.NO_SHOW]: { label: 'No Show', variant: 'outline' as const },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: 'outline' as const,
    };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case MeetingDTOMeetingType.VIRTUAL:
        return <Video className="h-4 w-4" />;
      case MeetingDTOMeetingType.PHONE_CALL:
        return <Phone className="h-4 w-4" />;
      case MeetingDTOMeetingType.IN_PERSON:
        return <MapPin className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  // Column definitions for the data table
  const columns = useMemo<ColumnDef<MeetingDTO>[]>(
    () => [
      {
        accessorKey: 'meetingDateTime',
        header: ({ column }) => {
          return (
            <Button
              variant="ghost"
              onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
              className="h-8 px-2 lg:px-3 text-xs"
            >
              Date & Time
              {column.getIsSorted() === 'asc' ? (
                <SortAsc className="ml-2 h-3 w-3" />
              ) : column.getIsSorted() === 'desc' ? (
                <SortDesc className="ml-2 h-3 w-3" />
              ) : (
                <Filter className="ml-2 h-3 w-3 opacity-50" />
              )}
            </Button>
          );
        },
        cell: ({ row }) => {
          const dateTime = row.getValue('meetingDateTime') as string;
          if (!dateTime) return <span className="text-muted-foreground text-xs">No date</span>;

          const date = new Date(dateTime);
          return (
            <div className="space-y-0.5">
              <div className="text-xs font-medium text-foreground">
                {format(date, 'MMM dd, yyyy')}
              </div>
              <div className="text-xs text-muted-foreground">{format(date, 'h:mm a')}</div>
            </div>
          );
        },
        size: 110,
        minSize: 110,
        maxSize: 110,
      },
      {
        accessorKey: 'title',
        header: 'Meeting Details',
        cell: ({ row }) => {
          const meeting = row.original;
          const title = meeting.title || 'Untitled Meeting';
          const duration = meeting.duration || 30;
          const type = meeting.meetingType || MeetingDTOMeetingType.VIRTUAL;

          return (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {getMeetingTypeIcon(type)}
                <span className="font-medium text-sm">{title}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{duration} minutes</span>
                <span>•</span>
                <span className="capitalize">{type.toLowerCase().replace('_', ' ')}</span>
              </div>
              {meeting.description && (
                <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {meeting.description}
                </div>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'organizer',
        header: 'Organizer',
        cell: ({ row }) => {
          const organizer = row.original.organizer;
          if (!organizer)
            return <span className="text-muted-foreground text-xs">No organizer</span>;

          return (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{organizer.displayName || organizer.firstName}</span>
            </div>
          );
        },
        size: 150,
        minSize: 150,
        maxSize: 150,
      },
      {
        accessorKey: 'meetingStatus',
        header: 'Status',
        cell: ({ row }) => {
          const status = row.getValue('meetingStatus') as string;
          return getMeetingStatusBadge(status);
        },
        size: 100,
        minSize: 100,
        maxSize: 100,
      },
      {
        id: 'actions',
        header: ({ column }) => {
          return <div className="text-right">Actions</div>;
        },
        cell: ({ row }) => {
          const meeting = row.original;
          const canCancel =
            meeting.meetingStatus === MeetingDTOMeetingStatus.SCHEDULED ||
            meeting.meetingStatus === MeetingDTOMeetingStatus.CONFIRMED;

          return (
            <div className="flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                  <DropdownMenuItem
                    onClick={() => openDetailsDialog(meeting)}
                    className="cursor-pointer"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  {meeting.meetingUrl && (
                    <DropdownMenuItem
                      onClick={() => window.open(meeting.meetingUrl, '_blank')}
                      className="cursor-pointer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Join Meeting
                    </DropdownMenuItem>
                  )}
                  {canCancel && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openCancelDialog(meeting)}
                        className="cursor-pointer text-destructive focus:text-destructive"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel Meeting
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        size: 80,
        minSize: 80,
        maxSize: 80,
      },
    ],
    []
  );

  // Initialize the table
  const table = useReactTable({
    data: meetings,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    enableColumnResizing: false,
    columnResizeMode: 'onChange',
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <>
      <Card className="w-full">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-lg font-semibold text-foreground">
                Scheduled Meetings
              </CardTitle>
              <Badge variant="secondary" className="text-xs">
                {meetings.length}
              </Badge>
            </div>
            <Button
              onClick={handleScheduleNewMeeting}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Schedule Meeting
            </Button>
          </div>

          {/* Search and filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search meetings..."
                value={globalFilter ?? ''}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              {table.getFilteredRowModel().rows.length} of {meetings.length} meetings
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-muted-foreground">Loading meetings...</div>
            </div>
          ) : meetings.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
              <div className="text-sm text-muted-foreground">No meetings scheduled</div>
              <div className="text-xs text-muted-foreground">
                Schedule the first meeting to start managing follow-ups
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Data Table */}
              <div className="rounded-md border">
                <Table className="table-fixed w-full">
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id} style={{ width: header.getSize() }}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && 'selected'}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} style={{ width: cell.column.getSize() }}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <Search className="h-6 w-6 text-muted-foreground" />
                            <span className="text-muted-foreground">No meetings found.</span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {table.getPageCount() > 1 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">Rows per page</p>
                    <select
                      value={table.getState().pagination.pageSize}
                      onChange={(e) => {
                        table.setPageSize(Number(e.target.value));
                      }}
                      className="h-8 w-[70px] rounded border border-input bg-background px-2 text-sm"
                    >
                      {[5, 10, 20].map((pageSize) => (
                        <option key={pageSize} value={pageSize}>
                          {pageSize}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-6 lg:gap-8">
                    <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                      Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                      >
                        <span className="sr-only">Go to previous page</span>←
                      </Button>
                      <Button
                        variant="outline"
                        className="h-8 w-8 p-0"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                      >
                        <span className="sr-only">Go to next page</span>→
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Meeting Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMeeting && getMeetingTypeIcon(selectedMeeting.meetingType || 'VIRTUAL')}
              Meeting Details
            </DialogTitle>
            <DialogDescription>Complete information about the scheduled meeting</DialogDescription>
          </DialogHeader>

          {selectedMeeting && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Title</label>
                  <p className="mt-1 text-sm">{selectedMeeting.title || 'Untitled Meeting'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    {getMeetingStatusBadge(selectedMeeting.meetingStatus || 'SCHEDULED')}
                  </div>
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Date & Time</label>
                  <p className="mt-1 text-sm">
                    {selectedMeeting.meetingDateTime &&
                      format(
                        new Date(selectedMeeting.meetingDateTime),
                        "EEEE, MMMM d, yyyy 'at' h:mm a"
                      )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Duration</label>
                  <p className="mt-1 text-sm">{selectedMeeting.duration || 30} minutes</p>
                </div>
              </div>

              {/* Meeting Type & Location */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Meeting Type</label>
                  <div className="mt-1 flex items-center gap-2">
                    {getMeetingTypeIcon(selectedMeeting.meetingType || 'VIRTUAL')}
                    <span className="text-sm capitalize">
                      {(selectedMeeting.meetingType || 'virtual').toLowerCase().replace('_', ' ')}
                    </span>
                  </div>
                </div>
                {selectedMeeting.meetingUrl && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Meeting Link
                    </label>
                    <div className="mt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(selectedMeeting.meetingUrl, '_blank')}
                        className="h-8"
                      >
                        <ExternalLink className="h-3 w-3 mr-2" />
                        Join Meeting
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Organizer */}
              {selectedMeeting.organizer && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Organizer</label>
                  <div className="mt-1 flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {selectedMeeting.organizer.displayName || selectedMeeting.organizer.firstName}
                    </span>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedMeeting.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1 text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                    {selectedMeeting.description}
                  </p>
                </div>
              )}

              {/* Notes */}
              {selectedMeeting.notes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Notes</label>
                  <p className="mt-1 text-sm whitespace-pre-wrap bg-muted/30 p-3 rounded-lg">
                    {selectedMeeting.notes}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Meeting Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this meeting? This action will notify all
              participants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowCancelDialog(false);
                setSelectedMeeting(null);
              }}
            >
              Keep Meeting
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelMeeting}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel Meeting'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
