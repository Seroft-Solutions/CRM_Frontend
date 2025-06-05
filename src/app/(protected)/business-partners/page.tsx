/**
 * Business Partners Management Page
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Building2, 
  Plus, 
  Search, 
  MoreHorizontal, 
  UserX, 
  Mail,
  ArrowLeft,
  Users
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrganizationContext } from '@/features/user-management/hooks';

interface BusinessPartner {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  enabled: boolean;
  emailVerified: boolean;
  createdTimestamp?: number;
  attributes?: Record<string, string[]>;
}

export default function BusinessPartnersPage() {
  const router = useRouter();
  const { organizationId, organizationName } = useOrganizationContext();
  
  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [partnerToRemove, setPartnerToRemove] = useState<BusinessPartner | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Fetch business partners
  const fetchPartners = async () => {
    if (!organizationId) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/keycloak/organizations/${organizationId}/partners`);
      if (!response.ok) {
        throw new Error('Failed to fetch business partners');
      }
      const data = await response.json();
      setPartners(data);
    } catch (error) {
      console.error('Failed to fetch partners:', error);
      toast.error('Failed to load business partners');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, [organizationId]);

  // Filter partners based on search
  const filteredPartners = partners.filter(partner =>
    partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${partner.firstName} ${partner.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Remove partner
  const handleRemovePartner = async () => {
    if (!partnerToRemove || !organizationId) return;

    setIsRemoving(true);
    try {
      const response = await fetch(
        `/api/keycloak/organizations/${organizationId}/partners/${partnerToRemove.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to remove partner');
      }

      toast.success('Partner removed successfully');
      setPartnerToRemove(null);
      fetchPartners(); // Refresh list
    } catch (error) {
      console.error('Failed to remove partner:', error);
      toast.error('Failed to remove partner');
    } finally {
      setIsRemoving(false);
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Business Partners</h1>
          <p className="text-muted-foreground">
            Manage business partners in {organizationName} ({filteredPartners.length} partners)
          </p>
        </div>
        <Button onClick={() => router.push('/invite-partners')} className="gap-2">
          <Plus className="h-4 w-4" />
          Invite Partner
        </Button>
      </div>

      {/* Partners Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Partner Management
          </CardTitle>
          <CardDescription>
            View and manage all business partners in your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search partners by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Partners Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Partner</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        Loading business partners...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPartners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Building2 className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {searchTerm ? 'No partners found matching your search' : 'No business partners yet'}
                        </p>
                        {!searchTerm && (
                          <Button variant="outline" onClick={() => router.push('/invite-partners')}>
                            Invite First Partner
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPartners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium">
                            {partner.firstName?.[0] || partner.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">
                              {partner.firstName} {partner.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              @{partner.username}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          {partner.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={partner.enabled ? "default" : "secondary"}>
                            {partner.enabled ? 'Active' : 'Inactive'}
                          </Badge>
                          {partner.emailVerified && (
                            <Badge variant="outline" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(partner.createdTimestamp)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => setPartnerToRemove(partner)}
                              className="text-red-600"
                            >
                              <UserX className="h-4 w-4 mr-2" />
                              Remove Partner
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Remove Partner Dialog */}
      <AlertDialog open={!!partnerToRemove} onOpenChange={() => setPartnerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Business Partner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{partnerToRemove?.firstName} {partnerToRemove?.lastName}</strong> 
              from {organizationName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemovePartner}
              disabled={isRemoving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRemoving ? 'Removing...' : 'Remove Partner'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
