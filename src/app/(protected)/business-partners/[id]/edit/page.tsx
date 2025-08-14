/**
 * Edit Business Partner Page
 * Clean slug-based approach for editing partner details
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PermissionGuard } from '@/core/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ArrowLeft, Save, Loader2, Edit, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useOrganizationContext } from '@/features/user-management/hooks';
import { useBusinessPartnersDataMutation } from '@/core/hooks/use-data-mutation-with-refresh';
import { useGetAllChannelTypes } from '@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen';
import { ChannelTypeSelector } from '@/features/user-profile-management/components/ChannelTypeSelector';

// Form validation schema
const updatePartnerSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  channelTypeId: z.number().min(1, 'Channel Type is required'),
});

type UpdatePartnerFormData = z.infer<typeof updatePartnerSchema>;

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

export default function EditPartnerPage() {
  const router = useRouter();
  const params = useParams();
  const { organizationId, organizationName } = useOrganizationContext();

  const [partner, setPartner] = useState<BusinessPartner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // Fetch channel types for selector
  const { data: channelTypes } = useGetAllChannelTypes();

  // FIXED: Use enhanced data mutation hook for proper cache invalidation
  const { updatePartner } = useBusinessPartnersDataMutation();

  // Form setup
  const form = useForm<UpdatePartnerFormData>({
    resolver: zodResolver(updatePartnerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      channelTypeId: undefined,
    },
    mode: 'onChange',
  });

  // Get partner ID from URL params and clean it
  const rawPartnerId = params.id as string;
  const partnerId = rawPartnerId?.split(':')[0]; // Remove any extra characters after :
  // Helper function to get channel type info from attributes
  const getChannelTypeInfo = (partner: BusinessPartner) => {
    const channelTypeId = partner.attributes?.channel_type_id?.[0];
    if (!channelTypeId) return null;

    if (channelTypes) {
      const channelType = channelTypes.find((ct) => ct.id === parseInt(channelTypeId));
      if (channelType) {
        return channelType.id;
      }
    }

    return parseInt(channelTypeId);
  };

  // Fetch partner details from all partners
  const fetchPartner = async () => {
    if (!organizationId || !partnerId) return;

    setIsLoading(true);
    try {
      // Fetch all partners since individual partner endpoint doesn't exist
      const response = await fetch(`/api/keycloak/organizations/${organizationId}/partners`);
      if (!response.ok) {
        throw new Error('Failed to fetch partners');
      }

      const allPartners = await response.json();
      const foundPartner = allPartners.find((p: BusinessPartner) => p.id === partnerId);

      if (!foundPartner) {
        throw new Error('Partner not found');
      }

      setPartner(foundPartner);

      // Populate form with partner data
      const channelTypeId = getChannelTypeInfo(foundPartner);
      form.reset({
        firstName: foundPartner.firstName || '',
        lastName: foundPartner.lastName || '',
        email: foundPartner.email,
        channelTypeId: channelTypeId || undefined,
      });
    } catch (error) {
      console.error('Failed to fetch partner:', error);
      toast.error('Failed to load partner details');
      router.push('/business-partners');
    } finally {
      setIsLoading(false);
    }
  };

  // FIXED: Update partner with enhanced error handling and cache invalidation
  const handleUpdatePartner = async (data: UpdatePartnerFormData) => {
    if (!partner || !organizationId) return;

    setIsUpdating(true);

    try {
      await updatePartner(async () => {
        console.log('Updating partner:', {
          partnerId: partner.id,
          organizationId,
          updateData: data,
        });

        const updatePayload = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          attributes: {
            ...partner.attributes,
            channel_type_id: [data.channelTypeId.toString()],
          },
        };

        console.log('Update payload:', updatePayload);

        const patchResponse = await fetch(
          `/api/keycloak/organizations/${organizationId}/partners/${partner.id}`,
          {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatePayload),
          }
        );

        if (!patchResponse.ok) {
          const errorText = await patchResponse.text();
          console.error('PATCH failed:', patchResponse.status, errorText);
          throw new Error(`Failed to update partner: ${patchResponse.status} ${errorText}`);
        }

        const result = await patchResponse.json();
        if (!result.success) {
          throw new Error('Update failed - no success confirmation received');
        }
      });

      // Success - the updatePartner hook will handle success toast and cache invalidation
      router.push('/business-partners');
    } catch (error) {
      console.error('Failed to update partner:', error);
      // Error handling is done by the updatePartner hook
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchPartner();
  }, [organizationId, partnerId]);
  return (
    <PermissionGuard
      requiredPermission="partner:update"
      unauthorizedTitle="Access Denied to Edit Partner"
      unauthorizedDescription="You don't have permission to edit business partners."
    >
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.push('/business-partners')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Edit Business Partner</h1>
            <p className="text-muted-foreground">
              Update partner information for {organizationName}
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12">
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading partner details...</span>
              </div>
            </CardContent>
          </Card>
        ) : partner ? (
          <>
            {/* Edit Partner Info */}
            <Alert className="border-blue-200 bg-blue-50">
              <Edit className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800">Edit Partner Information</AlertTitle>
              <AlertDescription className="text-blue-700">
                <div className="space-y-1 mt-2">
                  <p>• Update partner's personal information and contact details</p>
                  <p>• Change their assigned channel type for proper commission tracking</p>
                  <p>• All changes will be saved to the partner's account immediately</p>
                </div>
              </AlertDescription>
            </Alert>
            {/* Edit Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Partner Details
                </CardTitle>
                <CardDescription>
                  Update {partner.firstName} {partner.lastName}'s information below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleUpdatePartner)} className="space-y-6">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="John" disabled={isUpdating} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" disabled={isUpdating} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    {/* Email */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address *</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="john.doe@example.com"
                              disabled={true}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Channel Type */}
                    <FormField
                      control={form.control}
                      name="channelTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Channel Type *</FormLabel>
                          <FormControl>
                            <ChannelTypeSelector
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={isUpdating}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Action Buttons */}
                    <div className="flex gap-4 pt-4">
                      <Button
                        type="submit"
                        disabled={!form.formState.isValid || isUpdating}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isUpdating ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Updating Partner...
                          </>
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-2" />
                            Update Partner
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push('/business-partners')}
                        disabled={isUpdating}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Partner Not Found</h3>
                  <p className="text-muted-foreground">
                    The partner you're looking for doesn't exist or you don't have access to it.
                  </p>
                </div>
                <Button onClick={() => router.push('/business-partners')}>Back to Partners</Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PermissionGuard>
  );
}
