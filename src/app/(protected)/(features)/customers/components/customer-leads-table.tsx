'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { getAllCalls } from '@/core/api/generated/spring/endpoints/call-resource/call-resource.gen';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface CustomerLeadsTableProps {
  customerId: number;
}

const LEADS_PAGE_SIZE = 1000;
const MAX_LEADS_PAGES = 200;

const resolveAssigneeName = (call: Awaited<ReturnType<typeof getAllCalls>>[number]) => {
  const displayName = call.assignedTo?.displayName?.trim();
  const fullName = `${call.assignedTo?.firstName || ''} ${call.assignedTo?.lastName || ''}`.trim();
  const email = call.assignedTo?.email?.trim();

  return displayName || fullName || email || 'Unassigned';
};

const formatDateValue = (dateValue?: string) => {
  if (!dateValue) {
    return '-';
  }

  const parsedDate = new Date(dateValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return '-';
  }

  return format(parsedDate, 'dd MMM yyyy, hh:mm a');
};

export function CustomerLeadsTable({ customerId }: CustomerLeadsTableProps) {
  const {
    data: leads = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['customer-leads', customerId],
    queryFn: async () => {
      const customerLeads: Awaited<ReturnType<typeof getAllCalls>> = [];

      for (let page = 0; page < MAX_LEADS_PAGES; page += 1) {
        const pageData = await getAllCalls({
          page,
          size: LEADS_PAGE_SIZE,
          sort: ['createdDate,desc'],
          'customerId.equals': customerId,
          'status.equals': 'ACTIVE',
        });

        if (pageData.length === 0) {
          break;
        }

        customerLeads.push(...pageData);

        if (pageData.length < LEADS_PAGE_SIZE) {
          break;
        }
      }

      return customerLeads;
    },
    enabled: customerId > 0,
    staleTime: 60_000,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Customer Leads</h2>
          <p className="text-sm text-muted-foreground">
            Active leads linked to this customer ({leads.length})
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center rounded-md border bg-white">
          <p className="text-sm text-muted-foreground">Loading leads...</p>
        </div>
      ) : isError ? (
        <div className="flex h-40 items-center justify-center rounded-md border bg-white">
          <p className="text-sm text-muted-foreground">Failed to load customer leads.</p>
        </div>
      ) : leads.length === 0 ? (
        <div className="flex h-40 items-center justify-center rounded-md border bg-white">
          <p className="text-sm text-muted-foreground">No active leads found for this customer.</p>
        </div>
      ) : (
        <div className="table-container overflow-hidden rounded-md border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lead No</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Call Type</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Assigned To</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow key={lead.id || `${lead.leadNo}-${lead.createdDate}`}>
                  <TableCell className="font-medium">
                    {lead.id && lead.leadNo ? (
                      <Link
                        href={`/calls/${lead.id}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {lead.leadNo}
                      </Link>
                    ) : (
                      lead.leadNo || '-'
                    )}
                  </TableCell>
                  <TableCell>{lead.callStatus?.name || lead.status || '-'}</TableCell>
                  <TableCell>{lead.callType?.name || '-'}</TableCell>
                  <TableCell>{lead.channelType?.name || '-'}</TableCell>
                  <TableCell>{resolveAssigneeName(lead)}</TableCell>
                  <TableCell>{formatDateValue(lead.createdDate)}</TableCell>
                  <TableCell className="text-right">
                    {lead.id ? (
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/calls/${lead.id}`}>View</Link>
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
