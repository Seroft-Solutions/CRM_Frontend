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
    Trash2,
    Search,
} from 'lucide-react';
import { useDiscountsQuery, useDeleteDiscountMutation } from '../actions/discount-hooks';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export function DiscountTable() {
    const [search, setSearch] = React.useState('');
    const { data: discounts, isLoading } = useDiscountsQuery({ query: search });
    const { mutate: deleteDiscount } = useDeleteDiscountMutation();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-4">
            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative w-full">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search discounts..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {discounts?.length ? (
                            discounts.map((discount) => (
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
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive flex items-center gap-2 cursor-pointer"
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to delete this discount?')) {
                                                            deleteDiscount(discount.id!);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
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
