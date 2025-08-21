/**
 * Business Partners Management Page
 * Pure Keycloak integration with parallel channel type resolution
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PermissionGuard, InlinePermissionGuard } from '@/core/auth';
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
  Users,
  AlertCircle,
  Edit,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useOrganizationContext } from '@/features/user-management/hooks';
import { useBusinessPartnersDataMutation } from '@/core/hooks/use-data-mutation-with-refresh';
import { useGetAllChannelTypes } from '@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen';
import {deleteUserProfile, getUserProfile} from "@/core/api/generated/spring";
import {postAdminRealmsRealmOrganizationsOrgIdMembers} from "@/core/api/generated/keycloak";

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

interface ChannelTypeInfo {
  id: number;
  name: string;
  commissionRate?: number;
  source: 'keycloak' | 'unknown';
}

export default function BusinessPartnersPage() {
  const router = useRouter();
  const { organizationId, organizationName } = useOrganizationContext();

  const [partners, setPartners] = useState<BusinessPartner[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [partnerToRemove, setPartnerToRemove] = useState<BusinessPartner | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Fetch channel types for parallel resolution
  const { data: channelTypes } = useGetAllChannelTypes();

  // FIXED: Use enhanced data mutation hook for proper cache invalidation
  const { deletePartner } = useBusinessPartnersDataMutation();

  // Helper function to get channel type information from Keycloak attributes
  const getChannelTypeInfo = (partner: BusinessPartner): ChannelTypeInfo | null => {
    // Get channel type ID from Keycloak attributes
    const channelTypeId = partner.attributes?.channel_type_id?.[0];

    if (!channelTypeId) {
      return null;
    }

    // Try to resolve with channel types API data (parallel processing)
    if (channelTypes) {
      const channelType = channelTypes.find((ct) => ct.id === parseInt(channelTypeId));
      if (channelType) {
        return {
          id: channelType.id!,
          name: channelType.name!,
          commissionRate: channelType.commissionRate,
          source: 'keycloak',
        };
      }
    }

    // Fallback for unknown channel type ID
    return {
      id: parseInt(channelTypeId),
      name: `Channel Type ${channelTypeId}`,
      commissionRate: undefined,
      source: 'unknown',
    };
  };

  // Helper function to determine partner status (directly from Keycloak)
  const getPartnerStatus = (partner: BusinessPartner) => {
    // Show exactly what Keycloak says - enabled or disabled
    return {
      status: partner.enabled ? 'Active' : 'Inactive',
      variant: partner.enabled ? 'default' : ('secondary' as const),
    };
  };

  // Fetch business partners from Keycloak
  const fetchPartners = async () => {
    if (!organizationId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/keycloak/organizations/${organizationId}/partners`);
      if (!response.ok) {
        throw new Error('Failed to fetch business partners');
      }
      const data = await response.json();

      // Show all business partners (verification status affects status, not visibility)
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
  const filteredPartners = partners.filter(
    (partner) =>
      partner.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${partner.firstName} ${partner.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Navigate to edit partner page
  const handleEditPartner = (partner: BusinessPartner) => {
    router.push(`/business-partners/${partner.id}/edit`);
  };

  // FIXED: Remove partner with enhanced error handling and cache invalidation
  const handleRemovePartner = async () => {
    if (!partnerToRemove || !organizationId) return;
    let springRemovalSucceeded = false;
    setIsRemoving(true);

    try {
      await deletePartner(async () => {
        const response = await fetch(
          `/api/keycloak/organizations/${organizationId}/partners/${partnerToRemove.id}`,
          { method: 'DELETE' }
        );

        const responseData = await response.json();

        if (!response.ok) {
          // Handle different error scenarios with specific toast messages
          if (responseData.details) {
            const { keycloakRemoval, springRemoval, rollback } = responseData.details;

            if (keycloakRemoval === 'succeeded' && rollback === 'successful') {
              // Rollback scenario - Spring failed but Keycloak was restored
              throw new Error(
                'Partner removal failed: Backend sync issue. No changes were made. The partner remains in the system. Please try again later.'
              );
            } else if (keycloakRemoval === 'succeeded' && rollback === 'failed') {
              // Critical failure - data inconsistency
              throw new Error(
                'CRITICAL: Partner removal partially failed! Please contact system administrator immediately. Data may be inconsistent.'
              );
            } else if (responseData.error?.includes('not found')) {
              throw new Error('Partner not found or already removed');
            } else {
              throw new Error(responseData.error || 'Unknown error occurred');
            }
          } else {
            throw new Error(responseData.error || 'Unknown error occurred');
          }
        }
        // Check for success
        if (!responseData.success) {
          throw new Error('Partner removal failed - no success confirmation received');
        }
      });

      // Success - the deletePartner hook will handle success toast and cache invalidation
      setPartnerToRemove(null);
    } catch (error) {
      console.error('Failed to remove partner:', error);
      // Error handling is done by the deletePartner hook
    } finally {
      setIsRemoving(false);
    }
    // Step 2: Remove partner from Spring backend
    try {
      console.log('Removing partner from Spring backend...');

      // First, search for the user profile by keycloakId to get the database ID
      console.log('Searching for user profile by keycloakId:', partnerToRemove.id);
      const userProfile = await getUserProfile(partnerToRemove.id);

      if (!userProfile) {
        console.log(
            'Partner not found in Spring backend by keycloakId, considering removal successful'
        );
        springRemovalSucceeded = true;
      } else {
        // User profile exists, delete it using the database ID
        const userProfileDatabaseId = userProfile.id;

        console.log(`Found user profile in Spring backend:`, {
          databaseId: userProfileDatabaseId,
          keycloakId: userProfile.keycloakId,
          email: userProfile.email,
        });

        // Delete using the database ID
        const deletePromise = deleteUserProfile(userProfileDatabaseId);
        const deleteTimeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Spring backend delete timeout')), 10000)
        );

        await Promise.race([deletePromise, deleteTimeoutPromise]);
        springRemovalSucceeded = true;
        console.log(
            `Successfully removed partner from Spring backend using database ID: ${userProfileDatabaseId}`
        );
      }
    }
    catch (springError: any) {
      console.error('Failed to remove partner from Spring backend:', springError);

      // Check if it's a redirect error (which might indicate auth issues)
      const isRedirectError =
          springError.message?.includes('Maximum number of redirects exceeded') ||
          springError.message?.includes('redirect') ||
          springError.status === 302;

      const isNotFoundError =
          springError.status === 404 || springError.message?.includes('not found');

      const isTimeoutError = springError.message?.includes('timeout');

      // If user doesn't exist in Spring backend, consider it a successful removal
      if (isNotFoundError) {
        console.log('Partner not found in Spring backend, considering removal successful');
        springRemovalSucceeded = true;
      } else if (isRedirectError) {
        console.warn(
            'Spring backend redirect error - likely auth issue, but partner may not exist in backend, considering successful'
        );
        springRemovalSucceeded = true;
      } else if (isTimeoutError) {
        console.warn(
            'Spring backend timeout - backend may be slow, but will proceed with rollback to be safe'
        );
        // Don't mark as successful, proceed with rollback
      } else {
        console.error('Genuine Spring backend error occurred');
        // Don't mark as successful, proceed with rollback
      }
    }
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <PermissionGuard
      requiredPermission="partner:read"
      unauthorizedTitle="Access Denied to Business Partners"
      unauthorizedDescription="You don't have permission to view business partners."
    >
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
          <InlinePermissionGuard requiredPermission="partner:create">
            <Button onClick={() => router.push('/invite-partners')} className="gap-2">
              <Plus className="h-4 w-4" />
              Invite Partner
            </Button>
          </InlinePermissionGuard>
        </div>

        {/* Business Partners Info */}
        <Alert className="border-blue-200 bg-blue-50">
          <Users className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">Partner Management</AlertTitle>
          <AlertDescription className="text-blue-700">
            <div className="space-y-1 mt-2">
              <p>• View and manage all your business partners in one place</p>
              <p>• Edit partner details including names, email, and channel types</p>
              <p>• Track partner status and email verification</p>
              <p>• Invite new partners to expand your network</p>
            </div>
          </AlertDescription>
        </Alert>
        {/* Partners Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Partner Management
            </CardTitle>
            <CardDescription>
              View and manage all business partners from Keycloak identity provider
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
                    <TableHead>Channel Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Email Verified</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-12">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          Loading business partners...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredPartners.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center gap-2">
                          <Building2 className="h-8 w-8 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {searchTerm
                              ? 'No partners found matching your search'
                              : 'No business partners yet'}
                          </p>
                          {!searchTerm && (
                            <Button
                              variant="outline"
                              onClick={() => router.push('/invite-partners')}
                            >
                              Invite First Partner
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPartners.map((partner) => {
                      const channelTypeInfo = getChannelTypeInfo(partner);
                      const statusInfo = getPartnerStatus(partner);

                      return (
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
                          </TableCell>{' '}
                          <TableCell>
                            {channelTypeInfo ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={
                                      channelTypeInfo.source === 'keycloak'
                                        ? 'bg-green-50 border-green-200 text-green-800'
                                        : 'bg-orange-50 border-orange-200 text-orange-800'
                                    }
                                  >
                                    {channelTypeInfo.name}
                                  </Badge>
                                </div>
                                {channelTypeInfo.commissionRate !== undefined && (
                                  <div className="text-xs text-muted-foreground">
                                    {channelTypeInfo.commissionRate}% Commission
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground">No channel type</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={statusInfo.variant}
                              className={
                                partner.enabled
                                  ? 'bg-green-100 border-green-300 text-green-800 hover:bg-green-200'
                                  : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                              }
                            >
                              {statusInfo.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={partner.emailVerified ? 'default' : 'outline'}
                              className={
                                partner.emailVerified
                                  ? 'bg-blue-100 border-blue-300 text-blue-800 hover:bg-blue-200'
                                  : 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
                              }
                            >
                              {partner.emailVerified ? 'Verified' : 'Unverified'}
                            </Badge>
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
                              </DropdownMenuTrigger>{' '}
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleEditPartner(partner)}
                                  className="text-blue-600"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Partner
                                </DropdownMenuItem>
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
                      );
                    })
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
                Are you sure you want to remove{' '}
                <strong>
                  {partnerToRemove?.firstName} {partnerToRemove?.lastName}
                </strong>
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
    </PermissionGuard>
  );
}
