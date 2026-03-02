'use client';

import * as React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    MoreHorizontal,
    Pencil,
    Search,
    CheckCircle2,
    XCircle,
    Archive,
} from 'lucide-react';
import { useDiscountsQuery, useUpdateDiscountMutation } from '../actions/discount-hooks';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { IDiscount } from '../types/discount';

const statusTabOptions = [
    { value: 'active', label: 'Active', dotClass: 'bg-green-500' },
    { value: 'inactive', label: 'Inactive', dotClass: 'bg-yellow-500' },
    { value: 'archived', label: 'Archived', dotClass: 'bg-red-500' },
    { value: 'all', label: 'All', dotClass: '' },
];

const statusStyles: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-800 border-green-200',
    INACTIVE: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ARCHIVED: 'bg-red-100 text-red-800 border-red-200',
    DRAFT: 'bg-gray-100 text-gray-700 border-gray-200',
};

function normalizeStatus(status?: string) {
    return (status || 'ACTIVE').toUpperCase();
}

function formatStatus(status: string) {
    return status
        .toLowerCase()
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function formatDate(date?: string | null) {
    if (!date) {
        return '—';
    }

    const parsedDate = new Date(`${date}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
        return date;
    }

    return parsedDate.toLocaleDateString();
}

function formatTime(time?: string | null) {
    if (!time) {
        return '—';
    }

    const [hours, minutes] = time.split(':');
    if (hours === undefined || minutes === undefined) {
        return time;
    }

    return `${hours}:${minutes}`;
}

export function DiscountTable() {
    const [search, setSearch] = React.useState('');
    const [statusTab, setStatusTab] = React.useState('active');
    const statusFilter = statusTab === 'all' ? {} : { 'status.equals': statusTab.toUpperCase() };
    const normalizedSearch = search.trim();
    const searchFilter = normalizedSearch ? { 'discountCode.contains': normalizedSearch } : {};
    const { data: discounts, isLoading } = useDiscountsQuery({ ...searchFilter, ...statusFilter });
    const { mutate: updateDiscount } = useUpdateDiscountMutation();

    const handleStatusChange = (discount: IDiscount, status: string) => {
        if (!discount.id) {
            return;
        }

        updateDiscount({
            id: discount.id,
            discount: {
                ...discount,
                id: discount.id,
                status,
            },
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            <Tabs value={statusTab} onValueChange={setStatusTab}>
                <TabsList className="grid w-full grid-cols-4">
                    {statusTabOptions.map((option) => (
                        <TabsTrigger key={option.value} value={option.value} className="flex items-center gap-2">
                            {option.dotClass && <span className={`h-2 w-2 rounded-full ${option.dotClass}`} />}
                            {option.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </Tabs>

            <div className="table-container flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 max-w-sm w-full">
                    <div className="relative w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by discount code..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="rounded-lg border border-border bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>Start Time</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>End Time</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {discounts?.length ? (
                            discounts.map((discount) => {
                                const status = normalizeStatus(discount.status);
                                return (
                                    <TableRow key={discount.id}>
                                        <TableCell className="font-medium">
                                            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-bold">
                                                {discount.discountCode}
                                            </code>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {(discount.discountCategory || 'promo').toLowerCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {discount.discountType === 'AMOUNT' ? 'Fixed Amount' : 'Percentage'}
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {discount.discountType === 'AMOUNT'
                                                ? `₹${discount.discountValue?.toLocaleString()}`
                                                : `${discount.discountValue}%`}
                                        </TableCell>
                                        <TableCell>{formatDate(discount.startDate)}</TableCell>
                                        <TableCell>{formatTime(discount.discountStartTime)}</TableCell>
                                        <TableCell>{formatDate(discount.endDate)}</TableCell>
                                        <TableCell>{formatTime(discount.discountEndTime)}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={statusStyles[status] || 'bg-muted text-muted-foreground border-border'}
                                            >
                                                {formatStatus(status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/discounts/${discount.id}`} className="flex items-center gap-2 cursor-pointer">
                                                            <Pencil className="h-4 w-4" />
                                                            Edit
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusChange(discount, 'ACTIVE')}
                                                        disabled={status === 'ACTIVE'}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                        Set Active
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusChange(discount, 'INACTIVE')}
                                                        disabled={status === 'INACTIVE'}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <XCircle className="h-4 w-4 text-yellow-600" />
                                                        Set Inactive
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => handleStatusChange(discount, 'ARCHIVED')}
                                                        disabled={status === 'ARCHIVED'}
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Archive className="h-4 w-4 text-red-600" />
                                                        Archive
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={10} className="h-24 text-center text-muted-foreground">
                                    No discounts found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
