/**
 * Invite Users Component
 * Simplified workflow for inviting a single user to the organization
 */

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useAvailableGroups,
  useInviteUserWithGroups,
  useOrganizationContext,
  useUserManagementRefresh,
} from '@/features/user-management/hooks';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowLeft, CheckCircle, Mail, Send, UserPlus, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUserProfilePersistence } from '@/features/user-profile-management';

const inviteUserSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters'),
  selectedGroup: z.string().min(1, 'Group is required'),
  selectedGroups: z.array(z.string()).default([]),
  invitationNote: z.string().optional(),
});

type InviteUserFormValues = z.input<typeof inviteUserSchema>;

const ALLOWED_GROUP_NAMES = new Set(['user', 'users', 'salesman', 'salesmanager']);

function normalizeGroupName(value?: string) {
  return (value || '').toLowerCase().replace(/[\s_-]+/g, '');
}

function getGroupDisplayLabel(value?: string) {
  const normalizedName = normalizeGroupName(value);

  if (normalizedName === 'user' || normalizedName === 'users') {
    return 'User';
  }
  if (normalizedName === 'salesman') {
    return 'Salesman';
  }
  if (normalizedName === 'salesmanager') {
    return 'Sales Manager';
  }

  return value || '';
}

interface InviteUsersProps {
  className?: string;
}

export function InviteUsers({ className }: InviteUsersProps) {
  const router = useRouter();
  const { organizationId, organizationName } = useOrganizationContext();
  const { inviteUserWithGroupsAsync, isInviting: isInvitingWithGroups } = useInviteUserWithGroups();
  const { groups } = useAvailableGroups();
  const { refreshAllUserData } = useUserManagementRefresh();
  const { createProfileForPartner } = useUserProfilePersistence();

  const [invitationStatus, setInvitationStatus] = useState<{
    sent: InviteUserFormValues[];
    failed: { invitation: InviteUserFormValues; error: string }[];
  }>({ sent: [], failed: [] });

  const form = useForm<InviteUserFormValues>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      selectedGroup: '',
      selectedGroups: [],
      invitationNote: '',
    },
    mode: 'onChange',
  });
  const selectableGroups = useMemo(
    () =>
      groups.filter(
        (group) => !!group.id && ALLOWED_GROUP_NAMES.has(normalizeGroupName(group.name))
      ),
    [groups]
  );

  const watchedValues = form.watch();
  const isFormValid =
    form.formState.isValid &&
    watchedValues.email?.trim() !== '' &&
    watchedValues.firstName?.trim() !== '' &&
    watchedValues.lastName?.trim() !== '' &&
    watchedValues.selectedGroup?.trim() !== '';

  const handleInvite = async (data: InviteUserFormValues) => {
    const selectedGroup = selectableGroups.find((group) => group.id === data.selectedGroup);

    if (!selectedGroup) {
      toast.error('Please select a valid group');

      return;
    }

    try {
      const result = await inviteUserWithGroupsAsync({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        invitationNote: data.invitationNote,
        organizationId,
        selectedGroups: [selectedGroup],
      });

      console.log('Invitation result In page haha:', result);
      if (result.userId) {
        await createProfileForPartner(
          result.userId,
          result.email as string,
          result.firstName,
          result.lastName
        );
      }
      form.reset();
      setInvitationStatus((prev) => ({
        ...prev,
        sent: [...prev.sent, data],
      }));

      toast.success(`Invitation sent to ${data.firstName} ${data.lastName} (${data.email})`);

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

  const handleBack = () => {
    router.push('/user-management/organization-users');
  };

  return (
    <PermissionGuard requiredPermission="manage:users">
      <div className={`max-w-7xl mx-auto px-4 ${className}`}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invite User</h1>
            <p className="text-muted-foreground">Add a new user to {organizationName}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* How it works info */}
            <Alert className="border-blue-200 bg-blue-50">
              <Mail className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-800 text-sm font-semibold">
                How User Invitations Work
              </AlertTitle>
              <AlertDescription className="text-blue-700 text-xs">
                <div className="space-y-1.5 mt-2">
                  <p>• Invited user receives an email with account setup instructions</p>
                  <p>• They'll set their password and can immediately access the organization</p>
                  <p>
                    • You can view all users (including pending invitations) in the Organization
                    Users page
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            {/* Invitation Status - Only show when there are results */}
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
                        Successfully Sent ({invitationStatus.sent.length})
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

                  {/* Clear results and view users buttons */}
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
                        onClick={() => router.push('/user-management/organization-users')}
                        className="flex-1 text-xs h-8"
                      >
                        <Users className="h-3 w-3 mr-1" />
                        View Users
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
                  <UserPlus className="h-5 w-5" />
                  Invite User to Organization
                </CardTitle>
                <CardDescription>
                  Send an invitation to a user to join your organization. They'll receive an email
                  with setup instructions.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleInvite)} className="space-y-4 max-w-2xl">
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
                              <Input placeholder="Doe" disabled={isInvitingWithGroups} {...field} />
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

                    <FormField
                      control={form.control}
                      name="selectedGroup"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Group *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={isInvitingWithGroups || selectableGroups.length === 0}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select group" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectableGroups.map((group) => (
                                <SelectItem key={group.id} value={group.id!}>
                                  {getGroupDisplayLabel(group.name)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectableGroups.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                              No eligible groups found. Please create one of: User, Salesman, Sales
                              Manager.
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={!isFormValid || isInvitingWithGroups}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 gap-2"
                      >
                        {isInvitingWithGroups ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Sending Invitation...
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
                        onClick={() => {
                          form.reset();
                          setInvitationStatus({ sent: [], failed: [] });
                        }}
                        disabled={isInvitingWithGroups}
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
