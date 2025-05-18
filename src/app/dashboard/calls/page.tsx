'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetAllCalls } from '@/core/api/generated/endpoints/call-resource/call-resource.gen';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useState } from 'react';

export default function CallsPage() {
  const { data: calls = [], isLoading } = useGetAllCalls();
  const [tabValue, setTabValue] = useState("all");

  // Filter calls based on tab selection
  const filteredCalls = tabValue === "all" 
    ? calls 
    : calls.filter(call => call.status === tabValue.toUpperCase());

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Calls</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Call
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Call Management</CardTitle>
              <CardDescription>
                View and manage your customer calls
              </CardDescription>
            </div>
            <Tabs value={tabValue} onValueChange={setTabValue} className="w-[400px]">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Call Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCalls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No calls found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCalls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell>{call.id}</TableCell>
                      <TableCell>
                        <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${getStatusClass(call.status)}`}>
                          {call.status}
                        </span>
                      </TableCell>
                      <TableCell>{call.party?.name || 'N/A'}</TableCell>
                      <TableCell>{call.callType?.name || 'N/A'}</TableCell>
                      <TableCell>{call.priority?.name || 'N/A'}</TableCell>
                      <TableCell>{call.assignedTo ? `${call.assignedTo.firstName} ${call.assignedTo.lastName}` : 'Unassigned'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">View</Button>
                          <Button size="sm" variant="outline">Edit</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}

// Helper function to get status class
function getStatusClass(status: string | undefined) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
