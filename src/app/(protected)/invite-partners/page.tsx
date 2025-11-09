/**
 * Invite Partners Page
 * Partner invitation with "Business Partners" group assignment and enhanced UX
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Building2, Mail, ArrowLeft, Send, CheckCircle, AlertCircle, X, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useOrganizationContext } from '@/features/user-management/hooks';
import { ChannelTypeSelector } from '@/features/user-profile-management/components/ChannelTypeSelector';
import { useUserProfilePersistence } from '@/features/user-profile-management/hooks/useUserProfilePersistence';
import { PermissionGuard } from '@/core/auth';

const invitePartnerSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  channelTypeId: z.number().min(1, 'Channel Type is required'),
});

type InvitePartnerFormData = z.infer<typeof invitePartnerSchema>;

interface PartnerInvitation {
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  channelTypeId: number;
  redirectUri?: string;
}

interface InvitationResult {
  sent: InvitePartnerFormData[];
  failed: { invitation: InvitePartnerFormData; error: string }[];
}

export default function InvitePartnersPage() {
  const router = useRouter();
  const { organizationId, organizationName } = useOrganizationContext();
  const { createProfileForPartner, isCreating: isCreatingProfile } = useUserProfilePersistence();

  const [isInviting, setIsInviting] = useState(false);
  const [invitationStatus, setInvitationStatus] = useState<InvitationResult>({
    sent: [],
    failed: [],
  });

  const form = useForm<InvitePartnerFormData>({
    resolver: zodResolver(invitePartnerSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      channelTypeId: undefined,
    },
    mode: 'onChange',
  });

  const watchedValues = form.watch();
  const isFormValid =
    form.formState.isValid &&
    watchedValues.email?.trim() !== '' &&
    watchedValues.firstName?.trim() !== '' &&
    watchedValues.lastName?.trim() !== '' &&
    watchedValues.channelTypeId !== undefined;

  const handleSubmit = async (data: InvitePartnerFormData) => {
    if (!organizationId) {
      toast.error('No organization selected');
      return;
    }


    setIsInviting(true);

    try {
      const invitation: PartnerInvitation = {
        ...data,
        organizationId,
      };

      const response = await fetch(`/api/keycloak/organizations/${organizationId}/partners`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invitation),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to invite partner');
      }

      const result = await response.json();

      if (result.userId) {
        await createProfileForPartner(
          result.userId,
          data.email,
          data.firstName,
          data.lastName,
          data.channelTypeId
        );
      }

      const emailMessage =
        result.emailType === 'password_reset'
          ? 'Partner invited successfully. Password setup email sent.'
          : 'Partner invited successfully';

      const groupMessage = result.groupManagement?.message
        ? ` ${result.groupManagement.message}`
        : '';

      toast.success(`${emailMessage}${groupMessage}`);

      form.reset();
      setInvitationStatus((prev) => ({
        ...prev,
        sent: [...prev.sent, data],
      }));
    } catch (error) {
      console.error('Failed to invite partner:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to invite partner';
      toast.error(errorMessage);

      setInvitationStatus((prev) => ({
        ...prev,
        failed: [...prev.failed, { invitation: data, error: errorMessage }],
      }));
    } finally {
      setIsInviting(false);
    }
  };

  const handleClear = () => {
    form.reset();
    setInvitationStatus({ sent: [], failed: [] });
  };

  return (
    <PermissionGuard
      requiredPermission="partner:create"
      unauthorizedTitle="Access Denied to Invite Partners"
      unauthorizedDescription="You don't have permission to invite business partners."
    >
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invite Business Partner</h1>
            <p className="text-muted-foreground">Add a business partner to {organizationName}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* How it works info */}
            <Alert className="border-green-200 bg-green-50">
              <Building2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800 text-sm font-semibold">
                How Partner Invitations Work
              </AlertTitle>
              <AlertDescription className="text-green-700 text-xs">
                <div className="space-y-1.5 mt-2">
                  <p>• Invited partner receives an email with account setup instructions</p>
                  <p>• They'll set their password and be assigned to the Business Partners group</p>
                  <p>
                    • Channel type information is stored for commission and relationship management
                  </p>
                  <p>• You can view all partners in the Business Partners page</p>
                </div>
              </AlertDescription>
            </Alert>

            {/* Invitation Results - Only show when there are results */}
            {(invitationStatus.sent.length > 0 || invitationStatus.failed.length > 0) && (
              <Card className="shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Recent Invitations</CardTitle>
                      <CardDescription className="text-xs">
                        Status of your invitations
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {invitationStatus.sent.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-green-800 flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Successfully Invited ({invitationStatus.sent.length})
                      </div>
                      {invitationStatus.sent.map((invitation, index) => (
                        <div
                          key={index}
                          className="flex items-start justify-between p-2 bg-green-50 rounded-md border border-green-200"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-green-900 truncate">
                              {invitation.firstName} {invitation.lastName}
                            </p>
                            <p className="text-xs text-green-700 truncate">{invitation.email}</p>
                          </div>
                          <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs ml-2 shrink-0">
                            Sent
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {invitationStatus.failed.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-red-800 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        Failed ({invitationStatus.failed.length})
                      </div>
                      {invitationStatus.failed.map((failure, index) => (
                        <div key={index} className="p-2 bg-red-50 rounded-md border border-red-200">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-red-900 truncate">
                              {failure.invitation.firstName} {failure.invitation.lastName}
                            </span>
                            <Badge variant="destructive" className="text-xs ml-2 shrink-0">
                              Failed
                            </Badge>
                          </div>
                          <p className="text-xs text-red-700 truncate">
                            {failure.invitation.email}
                          </p>
                          <p className="text-xs text-red-600 mt-1">{failure.error}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Clear results and view partners buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInvitationStatus({ sent: [], failed: [] })}
                      className="flex-1 text-xs h-8"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Clear
                    </Button>
                    {invitationStatus.sent.length > 0 && (
                      <Button
                        size="sm"
                        onClick={() => router.push('/business-partners')}
                        className="flex-1 text-xs h-8"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        View Partners
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-2">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Invite Business Partner
                </CardTitle>
                <CardDescription>
                  Send an invitation to a business partner to join your organization. They'll
                  receive an email with setup instructions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-w-2xl">
                    {/* Name Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name *</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="John"
                                disabled={isInviting || isCreatingProfile}
                                {...field}
                              />
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
                              <Input
                                placeholder="Doe"
                                disabled={isInviting || isCreatingProfile}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Email and Channel Type in one row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                disabled={isInviting || isCreatingProfile}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                                disabled={isInviting || isCreatingProfile}
                                hideAddButton={true}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={!isFormValid || isInviting || isCreatingProfile}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 gap-2"
                      >
                        {isInviting || isCreatingProfile ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send Invitation
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleClear}
                        disabled={isInviting || isCreatingProfile}
                      >
                        Clear
                      </Button>
                    </div>

                    {/* Helper text */}
                    <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md border border-blue-200">
                      <p className="text-blue-800">
                        💡 <strong>Tip:</strong> The "Send Invitation" button will be enabled once
                        all required fields (* fields) are properly filled.
                      </p>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
