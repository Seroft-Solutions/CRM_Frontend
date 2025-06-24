
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { availableTimeSlotToast, handleAvailableTimeSlotError } from "./available-time-slot-toast";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  useGetAllAvailableTimeSlots,
  useDeleteAvailableTimeSlot,
  useCountAvailableTimeSlots,
  usePartialUpdateAvailableTimeSlot,
  
} from "@/core/api/generated/spring/endpoints/available-time-slot-resource/available-time-slot-resource.gen";




// Relationship data imports



import {
  useGetAllUserProfiles
} from "@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen";



import { AvailableTimeSlotSearchAndFilters } from "./available-time-slot-search-filters";
import { AvailableTimeSlotTableHeader } from "./available-time-slot-table-header";
import { AvailableTimeSlotTableRow } from "./available-time-slot-table-row";
import { BulkRelationshipAssignment } from "./bulk-relationship-assignment";

// Define sort ordering constants
const ASC = "asc";
const DESC = "desc";

interface FilterState {
  [key: string]: string | string[] | Date | undefined;
}

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export function AvailableTimeSlotTable() {
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("id");
  const [order, setOrder] = useState(ASC);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [filters, setFilters] = useState<FilterState>({});
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showBulkRelationshipDialog, setShowBulkRelationshipDialog] = useState(false);

  // Calculate API pagination parameters (0-indexed)
  const apiPage = page - 1;
  const pageSize = 10;

  
  // Fetch relationship data for dropdowns
  
  const { data: userprofileOptions = [] } = useGetAllUserProfiles(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );
  
  

  // Helper function to find entity ID by name
  const findEntityIdByName = (entities: any[], name: string, displayField: string = 'name') => {
    const entity = entities?.find(e => e[displayField]?.toLowerCase().includes(name.toLowerCase()));
    return entity?.id;
  };

  // Build filter parameters for API
  const buildFilterParams = () => {
    const params: Record<string, any> = {};
    
    
    // Map relationship filters from name-based to ID-based
    const relationshipMappings = {
      
      'user.displayName': { 
        apiParam: 'userId.equals', 
        options: userprofileOptions, 
        displayField: 'displayName' 
      },
      
    };
    
    
    // Add filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null) {
        
        // Handle relationship filters
        if (relationshipMappings[key]) {
          const mapping = relationshipMappings[key];
          const entityId = findEntityIdByName(mapping.options, value as string, mapping.displayField);
          if (entityId) {
            params[mapping.apiParam] = entityId;
          }
        }
        
        
        // Handle isBooked boolean filter
        else if (key === 'isBooked') {
          params['isBooked.equals'] = value === 'true';
        }
        
        
        
        // Handle slotDateTime date filter
        else if (key === 'slotDateTime') {
          if (value instanceof Date) {
            params['slotDateTime.equals'] = value.toISOString().split('T')[0];
          } else if (typeof value === 'string' && value.trim() !== '') {
            params['slotDateTime.equals'] = value;
          }
        }
        
        // Handle bookedAt date filter
        else if (key === 'bookedAt') {
          if (value instanceof Date) {
            params['bookedAt.equals'] = value.toISOString().split('T')[0];
          } else if (typeof value === 'string' && value.trim() !== '') {
            params['bookedAt.equals'] = value;
          }
        }
        
        
        // Handle duration text filter with contains
        else if (key === 'duration') {
          if (typeof value === 'string' && value.trim() !== '') {
            params['duration.contains'] = value;
          }
        }
        
        // Handle other filters
        else if (Array.isArray(value) && value.length > 0) {
          // Handle array values (for multi-select filters)
          params[key] = value;
        } else if (typeof value === 'string' && value.trim() !== '') {
          // Fallback for unknown string fields - use contains
          params[`${key}.contains`] = value;
        }
      }
    });

    // Add date range filters
    
    if (dateRange.from) {
      params['slotDateTime.greaterThanOrEqual'] = dateRange.from.toISOString();
    }
    if (dateRange.to) {
      params['slotDateTime.lessThanOrEqual'] = dateRange.to.toISOString();
    }
    
    if (dateRange.from) {
      params['bookedAt.greaterThanOrEqual'] = dateRange.from.toISOString();
    }
    if (dateRange.to) {
      params['bookedAt.lessThanOrEqual'] = dateRange.to.toISOString();
    }
    

    return params;
  };

  const filterParams = buildFilterParams();

  // Fetch data with React Query
  
  const { data, isLoading, refetch } = useGetAllAvailableTimeSlots(
    {
      page: apiPage,
      size: pageSize,
      sort: `${sort},${order}`,
      ...filterParams,
    },
    {
      query: {
        enabled: true,
      },
    }
  );
  

  // Get total count for pagination
  const { data: countData } = useCountAvailableTimeSlots(
    filterParams,
    {
      query: {
        enabled: true,
      },
    }
  );

  // Partial update mutation for relationship editing
  const { mutate: updateEntity, isPending: isUpdating } = usePartialUpdateAvailableTimeSlot({
    mutation: {
      onSuccess: () => {
        availableTimeSlotToast.updated();
        refetch();
      },
      onError: (error) => {
        handleAvailableTimeSlotError(error);
        throw error;
      },
    },
  });

  // Delete mutation
  const { mutate: deleteEntity, isPending: isDeleting } = useDeleteAvailableTimeSlot({
    mutation: {
      onSuccess: () => {
        availableTimeSlotToast.deleted();
        refetch();
      },
      onError: (error) => {
        handleAvailableTimeSlotError(error);
      },
    },
  });

  // Handle sort column click
  const handleSort = (column: string) => {
    if (sort === column) {
      setOrder(order === ASC ? DESC : ASC);
    } else {
      setSort(column);
      setOrder(ASC);
    }
  };

  // Get sort direction icon
  const getSortIcon = (column: string) => {
    if (sort !== column) {
      return "ChevronsUpDown";
    }
    return order === ASC ? "ChevronUp" : "ChevronDown";
  };

  // Handle delete
  const handleDelete = (id: number) => {
    setDeleteId(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      deleteEntity({ id: deleteId });
    }
    setShowDeleteDialog(false);
  };

  // Handle filter change
  const handleFilterChange = (column: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [column]: value
    }));
    setPage(1);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setSearchTerm("");
    setDateRange({ from: undefined, to: undefined });
    setPage(1);
  };

  

  // Calculate total pages
  const totalItems = countData || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  // Handle row selection
  const handleSelectRow = (id: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  // Handle select all
  const handleSelectAll = () => {
    if (data && selectedRows.size === data.length) {
      setSelectedRows(new Set());
    } else if (data) {
      setSelectedRows(new Set(data.map(item => item.id)));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    setShowBulkDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    const deletePromises = Array.from(selectedRows).map(id => 
      new Promise<void>((resolve, reject) => {
        deleteEntity({ id }, {
          onSuccess: () => resolve(),
          onError: (error) => reject(error)
        });
      })
    );

    try {
      await Promise.all(deletePromises);
      availableTimeSlotToast.bulkDeleted(selectedRows.size);
      setSelectedRows(new Set());
      refetch();
    } catch (error) {
      availableTimeSlotToast.bulkDeleteError();
    }
    setShowBulkDeleteDialog(false);
  };

  // Handle relationship updates
  const handleRelationshipUpdate = async (entityId: number, relationshipName: string, newValue: number | null) => {
    return new Promise<void>((resolve, reject) => {
      // For JHipster partial updates, need entity ID and relationship structure
      const updateData: any = {
        id: entityId
      };
      
      if (newValue) {
        updateData[relationshipName] = { id: newValue };
      } else {
        updateData[relationshipName] = null;
      }

      updateEntity({ 
        id: entityId,
        data: updateData
      }, {
        onSuccess: () => {
          availableTimeSlotToast.relationshipUpdated(relationshipName);
          resolve();
        },
        onError: (error) => {
          handleAvailableTimeSlotError(error);
          reject(error);
        }
      });
    });
  };

  // Handle bulk relationship updates
  const handleBulkRelationshipUpdate = async (entityIds: number[], relationshipName: string, newValue: number | null) => {
    let successCount = 0;
    let errorCount = 0;
    
    // Process updates sequentially to avoid overwhelming the server
    for (const id of entityIds) {
      try {
        await handleRelationshipUpdate(id, relationshipName, newValue);
        successCount++;
      } catch (error) {
        console.error(`Failed to update entity ${id}:`, error);
        errorCount++;
      }
    }
    
    // Refresh data after updates
    refetch();
    
    // Throw error if all failed, otherwise consider it partially successful
    if (errorCount === entityIds.length) {
      throw new Error(`All ${errorCount} updates failed`);
    } else if (errorCount > 0) {
      console.warn(`${errorCount} out of ${entityIds.length} updates failed`);
    }
  };

  // Prepare relationship configurations for components
  const relationshipConfigs = [
    
    {
      name: "user",
      displayName: "User",
      options: userprofileOptions || [],
      displayField: "displayName",
      isEditable: false, // Disabled by default
    },
    
  ];

  // Check if any filters are active
  const hasActiveFilters = Object.keys(filters).length > 0 || Boolean(searchTerm) || Boolean(dateRange.from) || Boolean(dateRange.to);
  const isAllSelected = data && data.length > 0 && selectedRows.size === data.length;
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < (data?.length || 0);

  return (
    <div className="space-y-4">
      {/* Bulk Actions */}
      {selectedRows.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <span className="text-sm text-muted-foreground">
            {selectedRows.size} item{selectedRows.size > 1 ? 's' : ''} selected
          </span>
          <div className="ml-auto flex gap-2">
            {relationshipConfigs.some(config => config.isEditable) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkRelationshipDialog(true)}
                className="gap-2"
              >
                Assign Associations
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
            >
              Delete Selected
            </Button>
          </div>
        </div>
      )}

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Clear All Filters
          </Button>
        </div>
      )}

      {/* Data Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table className="min-w-full">
          <AvailableTimeSlotTableHeader 
            onSort={handleSort}
            getSortIcon={getSortIcon}
            filters={filters}
            onFilterChange={handleFilterChange}
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
            onSelectAll={handleSelectAll}
          />
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.length ? (
              data.map((availableTimeSlot) => (
                <AvailableTimeSlotTableRow
                  key={availableTimeSlot.id}
                  availableTimeSlot={availableTimeSlot}
                  onDelete={handleDelete}
                  isDeleting={isDeleting}
                  isSelected={selectedRows.has(availableTimeSlot.id || 0)}
                  onSelect={handleSelectRow}
                  relationshipConfigs={relationshipConfigs}
                  onRelationshipUpdate={handleRelationshipUpdate}
                  isUpdating={isUpdating}
                />
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center"
                >
                  No available time slots found
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

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page > 1) setPage(page - 1);
                }}
                className={page <= 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumbers = [];
              const startPage = Math.max(1, page - 2);
              const endPage = Math.min(totalPages, startPage + 4);
              
              for (let j = startPage; j <= endPage; j++) {
                pageNumbers.push(j);
              }
              
              return pageNumbers[i];
            }).filter(Boolean).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(p);
                  }}
                  isActive={page === p}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  if (page < totalPages) setPage(page + 1);
                }}
                className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Bulk Delete Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedRows.size} item{selectedRows.size > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              selected available time slots and remove their data from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              availabletimeslot and remove its data from the server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
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
  );
}
