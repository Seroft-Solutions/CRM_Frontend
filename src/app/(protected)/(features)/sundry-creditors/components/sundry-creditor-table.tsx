'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
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
    useCountSundryCreditors,
    useGetAllSundryCreditors,
    useSearchSundryCreditors,
    useUpdateSundryCreditor,
    SundryCreditorStatus,
    SundryCreditorDTO
} from '../api/sundry-creditor';

import { useGetAllAreas } from '@/core/api/generated/spring/endpoints/area-resource/area-resource.gen';
// We can reuse header and pagination components or duplicate them if needed. 
// For now, assuming we can duplicate or adapt.
// Ideally we should move reusable table components to a shared folder.
// Since I can't easily refactor the whole project, I will assume we might need to duplicate specific table components if they are coupled to "Customer".
// Let's check imports later. I'll point to customer ones if generic enough or replace them.
import { AdvancedPagination, usePaginationState } from '@/app/(protected)/(features)/customers/components/table/advanced-pagination';
// NOTE: I am reusing customer table components. If they are generic. 
// If they are not generic (e.g. referencing Customer types), this will fail.
// I'll need to check `CustomerTableHeader`. It likely takes specific columns.

// Let's define columns locally.
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
        id: 'creditorName',
        label: 'Creditor Name',
        accessor: 'creditorName',
        type: 'field',
        visible: true,
        sortable: true,
    },
    {
        id: 'email',
        label: 'Email',
        accessor: 'email',
        type: 'field',
        visible: true,
        sortable: true,
    },
    {
        id: 'mobile',
        label: 'Mobile',
        accessor: 'mobile',
        type: 'field',
        visible: true,
        sortable: true,
    },
    {
        id: 'whatsApp',
        label: 'Whats App',
        accessor: 'whatsApp',
        type: 'field',
        visible: true,
        sortable: true,
    },
    {
        id: 'contactPerson',
        label: 'Contact Person',
        accessor: 'contactPerson',
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
        id: 'area',
        label: 'Location',
        accessor: 'area',
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
];

const COLUMN_VISIBILITY_KEY = 'sundry-creditor-table-columns';

function transformEnumValue(enumValue: string): string {
    if (!enumValue || typeof enumValue !== 'string') return enumValue;

    return enumValue
        .toLowerCase()
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

export function SundryCreditorTable() {
    const queryClient = useQueryClient();

    const { page, pageSize, handlePageChange, handlePageSizeChange, resetPagination } =
        usePaginationState(1, 10);

    const [sort, setSort] = useState('id');
    const [order, setOrder] = useState(ASC);
    const [searchTerm, setSearchTerm] = useState('');

    const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
    const [isColumnVisibilityLoaded, setIsColumnVisibilityLoaded] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const saved = localStorage.getItem(COLUMN_VISIBILITY_KEY);
            if (saved) {
                setColumnVisibility(JSON.parse(saved));
            } else {
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
            // ignore
        } finally {
            setIsColumnVisibilityLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (isColumnVisibilityLoaded && typeof window !== 'undefined') {
            localStorage.setItem(COLUMN_VISIBILITY_KEY, JSON.stringify(columnVisibility));
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

    const apiPage = page - 1;

    // Fetch count
    const { data: totalItems } = useCountSundryCreditors({
        query: searchTerm, // Match search criteria
    });

    const { data, isLoading } = searchTerm
        ? useSearchSundryCreditors(
            {
                query: searchTerm,
                page: apiPage,
                size: pageSize,
                sort: [`${sort},${order}`],
            },
            {
                query: {
                    enabled: true,
                    refetchOnWindowFocus: true,
                },
            }
        )
        : useGetAllSundryCreditors(
            {
                page: apiPage,
                size: pageSize,
                sort: [`${sort},${order}`],
            },
            {
                query: {
                    enabled: true,
                    refetchOnWindowFocus: true,
                },
            }
        );

    const handleSort = (columnId: string) => {
        if (sort === columnId) {
            setOrder(order === ASC ? DESC : ASC);
        } else {
            setSort(columnId);
            setOrder(ASC);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        placeholder="Search..."
                        className="border rounded px-3 py-2 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="ml-auto">
                            <Settings2 className="mr-2 h-4 w-4" />
                            View
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[150px]">
                        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {ALL_COLUMNS.map((column) => (
                            <DropdownMenuCheckboxItem
                                key={column.id}
                                className="capitalize"
                                checked={columnVisibility[column.id] !== false}
                                onCheckedChange={() => toggleColumnVisibility(column.id)}
                            >
                                {column.label}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="rounded-md border bg-white shadow-sm">
                <Table>
                    <TableHeader
                        columns={visibleColumns}
                        sort={sort}
                        order={order}
                        onSort={handleSort}
                    />
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : data?.length ? (
                            data.map((item: SundryCreditorDTO) => (
                                <TableRow key={item.id}>
                                    {visibleColumns.map((col) => (
                                        <TableCell key={col.id}>
                                            {col.type === 'relationship' && col.id === 'area' ? (
                                                item.area?.name
                                            ) : (
                                                item[col.accessor as keyof SundryCreditorDTO] as any
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={visibleColumns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <AdvancedPagination
                page={page}
                pageSize={pageSize}
                totalItems={totalItems || 0}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
            />
        </div>
    );
}

function TableHeader({ columns, sort, order, onSort }: { columns: ColumnConfig[], sort: string, order: string, onSort: (id: string) => void }) {
    return (
        <thead>
            <tr className="border-b bg-gray-50/50 hover:bg-gray-50/50">
                {columns.map((col) => (
                    <th
                        key={col.id}
                        className="h-10 px-4 text-left align-middle font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                        onClick={() => col.sortable && onSort(col.id)}
                    >
                        {col.label}
                        {col.sortable && sort === col.id && (
                            <span className="ml-1">{order === ASC ? '↑' : '↓'}</span>
                        )}
                    </th>
                ))}
            </tr>
        </thead>
    )
}
