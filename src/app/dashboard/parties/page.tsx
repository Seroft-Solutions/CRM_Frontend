'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGetAllParties } from '@/core/api/generated/endpoints/party-resource/party-resource.gen';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useState } from 'react';

export default function PartiesPage() {
  const { data: parties = [], isLoading } = useGetAllParties();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredParties = searchQuery 
    ? parties.filter(party => 
        party.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        party.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        party.mobile?.includes(searchQuery)
      )
    : parties;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Parties</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Party
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Party Management</CardTitle>
              <CardDescription>
                View and manage your customers and suppliers
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search parties..."
                className="w-full pl-8 bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
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
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParties.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No parties found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredParties.map((party) => (
                    <TableRow key={party.id}>
                      <TableCell>{party.id}</TableCell>
                      <TableCell className="font-medium">{party.name}</TableCell>
                      <TableCell>{party.contactPerson || 'N/A'}</TableCell>
                      <TableCell>{party.mobile || 'N/A'}</TableCell>
                      <TableCell>{party.email || 'N/A'}</TableCell>
                      <TableCell>{party.city?.name || 'N/A'}</TableCell>
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
