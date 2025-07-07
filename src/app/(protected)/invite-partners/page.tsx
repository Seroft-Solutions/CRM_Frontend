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

// Form validation schema
const invitePartnerSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  firstName: z.string().min(1, 'First name is required').min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required').min(2, 'Last name must be at least 2 characters'),
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
    failed: [] 
  });

  // Form setup with validation
  const form = useForm<InvitePartnerFormData>({
    resolver: zodResolver(invitePartnerSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      channelTypeId: undefined,
    },
    mode: 'onChange', // Enable real-time validation
  });

  // Watch form values to enable/disable button
  const watchedValues = form.watch();
  const isFormValid = form.formState.isValid && 
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

      // Create user profile with channel type if invitation was successful
      if (result.userId) {
        await createProfileForPartner(
          result.userId,
          data.email,
          data.firstName,
          data.lastName,
          data.channelTypeId
        );
      }

      // Show appropriate success message based on email type
      const emailMessage =
        result.emailType === 'password_reset'
          ? 'Partner invited successfully. Password setup email sent.'
          : 'Partner invited successfully';

      const groupMessage = result.groupManagement?.message
        ? ` ${result.groupManagement.message}`
        : '';

      toast.success(`${emailMessage}${groupMessage}`);

      // Clear form and update status
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
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invite Business Partner</h1>
            <p className="text-muted-foreground">Add a business partner to {organizationName}</p>
          </div>
        </div>

        {/* How it works info */}
        <Alert className="border-green-200 bg-green-50">
          <Building2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">How Partner Invitations Work</AlertTitle>
          <AlertDescription className="text-green-700">
            <div className="space-y-1 mt-2">
              <p>• Invited partner receives an email with account setup instructions</p>
              <p>• They'll set their password and be assigned to the Business Partners group</p>
              <p>• Channel type information is stored for commission and relationship management</p>
              <p>• You can view all partners in the Business Partners page</p>
            </div>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Invite Business Partner
            </CardTitle>
            <CardDescription>
              Send an invitation to a business partner to join your organization.
              They'll receive an email with setup instructions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                          disabled={isInviting || isCreatingProfile}
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
                          disabled={isInviting || isCreatingProfile}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                <div className="text-sm text-muted-foreground">
                  <p>
                    💡 <strong>Tip:</strong> The "Send Invitation" button will be enabled once all required fields (* fields) are properly filled.
                  </p>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Invitation Results - Only show when there are results */}
        {(invitationStatus.sent.length > 0 || invitationStatus.failed.length > 0) && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invitation Results</CardTitle>
                  <CardDescription>Status of your recent partner invitations</CardDescription>
                </div>
                {invitationStatus.sent.length > 0 && (
                  <Button 
                    onClick={() => router.push('/business-partners')}
                    className="gap-2"
                  >
                    <Building2 className="h-4 w-4" />
                    View Business Partners
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {invitationStatus.sent.length > 0 && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">
                    Successfully Invited ({invitationStatus.sent.length})
                  </AlertTitle>
                  <AlertDescription className="text-green-700">
                    <div className="space-y-2 mt-2">
                      {invitationStatus.sent.map((invitation, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-green-100 rounded-md"
                        >
                          <div>
                            <span className="text-sm font-medium text-green-900">
                              {invitation.firstName} {invitation.lastName}
                            </span>
                            <span className="text-sm text-green-700 ml-2">
                              ({invitation.email})
                            </span>
                          </div>
                          <Badge className="bg-green-600 hover:bg-green-700 text-white">
                            Partner Invited
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-green-100 rounded-md">
                      <p className="text-sm text-green-800">
                        💡 <strong>Next step:</strong> Invited partners will receive an email with setup instructions. 
                        They'll appear in your Business Partners list once they accept.
                      </p>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {invitationStatus.failed.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">
                    Failed to Send ({invitationStatus.failed.length})
                  </AlertTitle>
                  <AlertDescription className="text-red-700">
                    <div className="space-y-2 mt-2">
                      {invitationStatus.failed.map((failure, index) => (
                        <div key={index} className="p-3 bg-red-100 rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-red-900">
                              {failure.invitation.firstName} {failure.invitation.lastName} (
                              {failure.invitation.email})
                            </span>
                            <Badge variant="destructive">Failed</Badge>
                          </div>
                          <p className="text-xs text-red-700 bg-red-50 p-2 rounded">
                            <strong>Error:</strong> {failure.error}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Clear results button */}
              <div className="flex justify-center pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setInvitationStatus({ sent: [], failed: [] })}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Results
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PermissionGuard>
  );
}
