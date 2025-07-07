/**
 * Invite Users Component
 * Simplified workflow for inviting a single user to the organization
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useInviteUserWithGroups,
  useOrganizationContext,
  useAvailableGroups,
  useUserManagementRefresh,
} from '../hooks';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  Mail,
  ArrowLeft,
  Send,
  Users,
  CheckCircle,
  AlertCircle,
  X,
} from 'lucide-react';
import type { InviteUserFormDataWithGroups } from '../types';
import { toast } from 'sonner';

// Form validation schema
const inviteUserSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  firstName: z.string().min(1, 'First name is required').min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(1, 'Last name is required').min(2, 'Last name must be at least 2 characters'),
  selectedGroups: z.array(z.string()).default([]),
  invitationNote: z.string().optional(),
});

interface InviteUsersProps {
  className?: string;
}

export function InviteUsers({ className }: InviteUsersProps) {
  const router = useRouter();
  const { organizationId, organizationName } = useOrganizationContext();
  const {
    inviteUserWithGroups,
    inviteUserWithGroupsAsync,
    isInviting: isInvitingWithGroups,
  } = useInviteUserWithGroups();
  const { groups } = useAvailableGroups();
  const { refreshOrganizationUsers, refreshAllUserData } = useUserManagementRefresh();

  // Local state
  const [invitationStatus, setInvitationStatus] = useState<{
    sent: InviteUserFormDataWithGroups[];
    failed: { invitation: InviteUserFormDataWithGroups; error: string }[];
  }>({ sent: [], failed: [] });

  // Single invitation form
  const form = useForm<InviteUserFormDataWithGroups>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      selectedGroups: [],
      invitationNote: '',
    },
    mode: 'onChange', // Enable real-time validation
  });

  // Watch form values to enable/disable button
  const watchedValues = form.watch();
  const isFormValid = form.formState.isValid && 
    watchedValues.email?.trim() !== '' && 
    watchedValues.firstName?.trim() !== '' && 
    watchedValues.lastName?.trim() !== '';

  // Handle user invitation
  const handleInvite = async (data: InviteUserFormDataWithGroups) => {
    const selectedGroups = groups.filter((g) => data.selectedGroups.includes(g.id!));

    try {
      await inviteUserWithGroupsAsync({
        ...data,
        organizationId,
        selectedGroups,
      });

      // Clear form and update status
      form.reset();
      setInvitationStatus((prev) => ({
        ...prev,
        sent: [...prev.sent, data],
      }));

      // Show clear success message
      toast.success(
        `Invitation sent to ${data.firstName} ${data.lastName} (${data.email})`
      );

      // Refresh data in background (no UI blocking)
      refreshAllUserData(organizationId);
      
    } catch (error) {
      setInvitationStatus((prev) => ({
        ...prev,
        failed: [
          ...prev.failed,
          {
            invitation: data,
            error: error instanceof Error ? error.message : 'Failed to send invitation',
          },
        ],
      }));
    }
  };

  // Navigate back to organization users
  const handleBack = () => {
    router.push('/user-management/organization-users');
  };

  return (
    <PermissionGuard requiredPermission="manage:users">
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invite User</h1>
            <p className="text-muted-foreground">Add a new user to {organizationName}</p>
          </div>
        </div>

        {/* How it works info */}
        <Alert className="border-blue-200 bg-blue-50">
          <Mail className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">How User Invitations Work</AlertTitle>
          <AlertDescription className="text-blue-700">
            <div className="space-y-1 mt-2">
              <p>• Invited user receives an email with account setup instructions</p>
              <p>• They'll set their password and can immediately access the organization</p>
              <p>• You can view all users (including pending invitations) in the Organization Users page</p>
            </div>
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite User to Organization
            </CardTitle>
            <CardDescription>
              Send an invitation to a user to join your organization. 
              They'll receive an email with setup instructions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleInvite)} className="space-y-4">
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
                            disabled={isInvitingWithGroups}
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
                            disabled={isInvitingWithGroups} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                          disabled={isInvitingWithGroups}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={!isFormValid || isInvitingWithGroups}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {isInvitingWithGroups ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                        Sending Invitation...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Invitation
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      form.reset();
                      setInvitationStatus({ sent: [], failed: [] }); // Clear status when clearing form
                    }}
                    disabled={isInvitingWithGroups}
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

        {/* Invitation Status - Only show when there are results */}
        {(invitationStatus.sent.length > 0 || invitationStatus.failed.length > 0) && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Invitation Results</CardTitle>
                  <CardDescription>Status of your recent invitations</CardDescription>
                </div>
                {invitationStatus.sent.length > 0 && (
                  <Button 
                    onClick={() => router.push('/user-management/organization-users')}
                    className="gap-2"
                  >
                    <Users className="h-4 w-4" />
                    View Organization Users
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {invitationStatus.sent.length > 0 && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">
                    Successfully Sent ({invitationStatus.sent.length})
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
                            Invitation Sent
                          </Badge>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 p-3 bg-green-100 rounded-md">
                      <p className="text-sm text-green-800">
                        💡 <strong>Next step:</strong> Invited users will receive an email with setup instructions. 
                        They'll appear in your Organization Users list once they accept.
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
                    <div className="mt-4 p-3 bg-red-100 rounded-md">
                      <p className="text-sm text-red-800">
                        💡 <strong>Tip:</strong> Check email addresses and try again. 
                        Users might already exist in the system.
                      </p>
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
