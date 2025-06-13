
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { callToast, handleCallError } from "./call-toast";
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
  useGetAllCalls,
  useDeleteCall,
  useCountCalls,
  usePartialUpdateCall,
  useSearchCalls,
} from "@/core/api/generated/spring/endpoints/call-resource/call-resource.gen";




// Relationship data imports



import {
  useGetAllPriorities
} from "@/core/api/generated/spring/endpoints/priority-resource/priority-resource.gen";

import {
  useGetAllCallTypes
} from "@/core/api/generated/spring/endpoints/call-type-resource/call-type-resource.gen";

import {
  useGetAllSubCallTypes
} from "@/core/api/generated/spring/endpoints/sub-call-type-resource/sub-call-type-resource.gen";

import {
  useGetAllSources
} from "@/core/api/generated/spring/endpoints/source-resource/source-resource.gen";

import {
  useGetAllChannelTypes
} from "@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen";

import {
  useGetAllCallCategories
} from "@/core/api/generated/spring/endpoints/call-category-resource/call-category-resource.gen";

import {
  useGetAllCallStatuses
} from "@/core/api/generated/spring/endpoints/call-status-resource/call-status-resource.gen";

import {
  useGetAllStates
} from "@/core/api/generated/spring/endpoints/state-resource/state-resource.gen";

import {
  useGetAllDistricts
} from "@/core/api/generated/spring/endpoints/district-resource/district-resource.gen";

import {
  useGetAllCities
} from "@/core/api/generated/spring/endpoints/city-resource/city-resource.gen";

import {
  useGetAllAreas
} from "@/core/api/generated/spring/endpoints/area-resource/area-resource.gen";

import {
  useGetAllUserProfiles
} from "@/core/api/generated/spring/endpoints/user-profile-resource/user-profile-resource.gen";

import {
  useGetAllParties
} from "@/core/api/generated/spring/endpoints/party-resource/party-resource.gen";



import { CallSearchAndFilters } from "./call-search-filters";
import { CallTableHeader } from "./call-table-header";
import { CallTableRow } from "./call-table-row";
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

export function CallTable() {
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
  
  const { data: channeltypeOptions = [] } = useGetAllChannelTypes(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );
  
  const { data: callcategoryOptions = [] } = useGetAllCallCategories(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );
  
  const { data: callstatusOptions = [] } = useGetAllCallStatuses(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );
  
  const { data: stateOptions = [] } = useGetAllStates(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );
  
  const { data: districtOptions = [] } = useGetAllDistricts(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );
  
  const { data: cityOptions = [] } = useGetAllCities(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );
  
  const { data: areaOptions = [] } = useGetAllAreas(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );
  
  const { data: userprofileOptions = [] } = useGetAllUserProfiles(
    { page: 0, size: 1000 },
    { query: { enabled: true } }
  );
  
  const { data: partyOptions = [] } = useGetAllParties(
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
      
      'priority.name': { 
        apiParam: 'priorityId.equals', 
        options: priorityOptions, 
        displayField: 'name' 
      },
      
      'callType.name': { 
        apiParam: 'callTypeId.equals', 
        options: calltypeOptions, 
        displayField: 'name' 
      },
      
      'subCallType.name': { 
        apiParam: 'subCallTypeId.equals', 
        options: subcalltypeOptions, 
        displayField: 'name' 
      },
      
      'source.name': { 
        apiParam: 'sourceId.equals', 
        options: sourceOptions, 
        displayField: 'name' 
      },
      
      'channelType.name': { 
        apiParam: 'channelTypeId.equals', 
        options: channeltypeOptions, 
        displayField: 'name' 
      },
      
      'callCategory.name': { 
        apiParam: 'callCategoryId.equals', 
        options: callcategoryOptions, 
        displayField: 'name' 
      },
      
      'callStatus.name': { 
        apiParam: 'callStatusId.equals', 
        options: callstatusOptions, 
        displayField: 'name' 
      },
      
      'state.name': { 
        apiParam: 'stateId.equals', 
        options: stateOptions, 
        displayField: 'name' 
      },
      
      'district.name': { 
        apiParam: 'districtId.equals', 
        options: districtOptions, 
        displayField: 'name' 
      },
      
      'city.name': { 
        apiParam: 'cityId.equals', 
        options: cityOptions, 
        displayField: 'name' 
      },
      
      'area.name': { 
        apiParam: 'areaId.equals', 
        options: areaOptions, 
        displayField: 'name' 
      },
      
      'assignedTo.email': { 
        apiParam: 'assignedToId.equals', 
        options: userprofileOptions, 
        displayField: 'email' 
      },
      
      'channelParty.email': { 
        apiParam: 'channelPartyId.equals', 
        options: userprofileOptions, 
        displayField: 'email' 
      },
      
      'party.name': { 
        apiParam: 'partyId.equals', 
        options: partyOptions, 
        displayField: 'name' 
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
        
        
        // Handle other direct filters
        else if (Array.isArray(value) && value.length > 0) {
          params[key] = value;
        } else if (value instanceof Date) {
          params[key] = value.toISOString().split('T')[0];
        } else if (typeof value === 'string' && value.trim() !== '') {
          params[key] = value;
        }
      }
    });

    // Add date range filters
    
    if (dateRange.from) {
      params['callDateTime.greaterThanOrEqual'] = dateRange.from.toISOString();
    }
    if (dateRange.to) {
      params['callDateTime.lessThanOrEqual'] = dateRange.to.toISOString();
    }
    

    return params;
  };

  const filterParams = buildFilterParams();

  // Fetch data with React Query
  
  const { data, isLoading, refetch } = searchTerm 
    ? useSearchCalls(
        {
          query: searchTerm,
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
      )
    : useGetAllCalls(
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
  const { data: countData } = useCountCalls(
    filterParams,
    {
      query: {
        enabled: true,
      },
    }
  );

  // Partial update mutation for relationship editing
  const { mutate: updateEntity, isPending: isUpdating } = usePartialUpdateCall({
    mutation: {
      onSuccess: () => {
        callToast.updated();
        refetch();
      },
      onError: (error) => {
        handleCallError(error);
        throw error;
      },
    },
  });

  // Delete mutation
  const { mutate: deleteEntity, isPending: isDeleting } = useDeleteCall({
    mutation: {
      onSuccess: () => {
        callToast.deleted();
        refetch();
      },
      onError: (error) => {
        handleCallError(error);
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

  
  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
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
      callToast.bulkDeleted(selectedRows.size);
      setSelectedRows(new Set());
      refetch();
    } catch (error) {
      callToast.bulkDeleteError();
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
          callToast.relationshipUpdated(relationshipName);
          resolve();
        },
        onError: (error) => {
          handleCallError(error);
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
      name: "priority",
      displayName: "Priority",
      options: priorityOptions || [],
      displayField: "name",
      isEditable: false, // Disabled by default
    },
    
    {
      name: "callType",
      displayName: "CallType",
      options: calltypeOptions || [],
      displayField: "name",
      isEditable: false, // Disabled by default
    },
    
    {
      name: "subCallType",
      displayName: "SubCallType",
      options: subcalltypeOptions || [],
      displayField: "name",
      isEditable: false, // Disabled by default
    },
    
    {
      name: "source",
      displayName: "Source",
      options: sourceOptions || [],
      displayField: "name",
      isEditable: false, // Disabled by default
    },
    
    {
      name: "channelType",
      displayName: "ChannelType",
      options: channeltypeOptions || [],
      displayField: "name",
      isEditable: false, // Disabled by default
    },
    
    {
      name: "callCategory",
      displayName: "CallCategory",
      options: callcategoryOptions || [],
      displayField: "name",
      isEditable: false, // Disabled by default
    },
    
    {
      name: "callStatus",
      displayName: "CallStatus",
      options: callstatusOptions || [],
      displayField: "name",
      isEditable: false, // Disabled by default
    },
    
    {
      name: "state",
      displayName: "State",
      options: stateOptions || [],
      displayField: "name",
      isEditable: false, // Disabled by default
    },
    
    {
      name: "district",
      displayName: "District",
      options: districtOptions || [],
      displayField: "name",
      isEditable: false, // Disabled by default
    },
    
    {
      name: "city",
      displayName: "City",
      options: cityOptions || [],
      displayField: "name",
      isEditable: false, // Disabled by default
    },
    
    {
      name: "area",
      displayName: "Area",
      options: areaOptions || [],
      displayField: "name",
      isEditable: false, // Disabled by default
    },
    
    {
      name: "assignedTo",
      displayName: "AssignedTo",
      options: userprofileOptions || [],
      displayField: "email",
      isEditable: false, // Disabled by default
    },
    
    {
      name: "channelParty",
      displayName: "ChannelParty",
      options: userprofileOptions || [],
      displayField: "email",
      isEditable: false, // Disabled by default
    },
    
    {
      name: "party",
      displayName: "Party",
      options: partyOptions || [],
      displayField: "name",
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
          <CallTableHeader 
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
                  colSpan={16}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : data?.length ? (
              data.map((call) => (
                <CallTableRow
                  key={call.id}
                  call={call}
                  onDelete={handleDelete}
                  isDeleting={isDeleting}
                  isSelected={selectedRows.has(call.id || 0)}
                  onSelect={handleSelectRow}
                  relationshipConfigs={relationshipConfigs}
                  onRelationshipUpdate={handleRelationshipUpdate}
                  isUpdating={isUpdating}
                />
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={16}
                  className="h-24 text-center"
                >
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
              selected calls and remove their data from the server.
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
              call and remove its data from the server.
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
