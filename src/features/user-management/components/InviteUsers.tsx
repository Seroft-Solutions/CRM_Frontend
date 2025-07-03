/**
 * Invite Users Component
 * Dedicated workflow for inviting users to the organization
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useInviteUser,
  useInviteUserWithGroups,
  useOrganizationContext,
  useAvailableGroups,
  useUserManagementRefresh,
} from '../hooks';
import { PermissionGuard } from '@/core/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  UserPlus,
  Mail,
  Plus,
  Trash2,
  Upload,
  FileText,
  ArrowLeft,
  Send,
  Users,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import type {
  InviteUserFormData,
  BulkInviteFormData,
  InviteUserFormDataWithGroups,
  BulkInviteFormDataWithGroups,
} from '../types';
import { toast } from 'sonner';

// Form validation schemas
const inviteUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  selectedGroups: z.array(z.string()).default([]),
  invitationNote: z.string().optional(),
});

const inviteUserWithGroupsSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  selectedGroups: z.array(z.string()).default([]),
  invitationNote: z.string().optional(),
});

const bulkInviteSchema = z.object({
  manualInvitations: z
    .array(inviteUserWithGroupsSchema)
    .min(1, 'At least one invitation is required'),
  defaultGroups: z.array(z.string()).default([]),
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
    isSuccess,
  } = useInviteUserWithGroups();
  const { groups } = useAvailableGroups();
  const { refreshOrganizationUsers, refreshAllUserData } = useUserManagementRefresh();

  // Local state
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [invitationStatus, setInvitationStatus] = useState<{
    sent: InviteUserFormDataWithGroups[];
    failed: { invitation: InviteUserFormDataWithGroups; error: string }[];
  }>({ sent: [], failed: [] });
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Group options for MultiSelect
  const groupOptions = groups.map((group) => ({
    value: group.id!,
    label: group.name || '',
  }));

  // Single invitation form with groups
  const singleForm = useForm<InviteUserFormDataWithGroups>({
    resolver: zodResolver(inviteUserWithGroupsSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      selectedGroups: [],
      invitationNote: '',
    },
  });

  // Bulk invitation form with groups
  const bulkForm = useForm<BulkInviteFormDataWithGroups>({
    resolver: zodResolver(bulkInviteSchema),
    defaultValues: {
      manualInvitations: [
        { email: '', firstName: '', lastName: '', selectedGroups: [], invitationNote: '' },
      ],
      defaultGroups: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: bulkForm.control,
    name: 'manualInvitations',
  });

  // Handle single user invitation with groups
  const handleSingleInvite = async (data: InviteUserFormDataWithGroups) => {
    const selectedGroups = groups.filter((g) => data.selectedGroups.includes(g.id!));

    try {
      await inviteUserWithGroupsAsync({
        ...data,
        organizationId,
        selectedGroups,
      });

      // Reset form on success
      singleForm.reset();
      setInvitationStatus((prev) => ({
        ...prev,
        sent: [...prev.sent, data],
      }));

      // Force refresh of organization users data
      await refreshAllUserData(organizationId);

      // Show success dialog and auto-navigate after delay
      setShowSuccessDialog(true);
      setTimeout(() => {
        setShowSuccessDialog(false);
        router.push('/user-management/organization-users');
      }, 2000);
    } catch (error) {
      // Error handling is done by the hook, just update local status
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

  // Handle bulk invitations with groups
  const handleBulkInvite = async (data: BulkInviteFormDataWithGroups) => {
    const sent: InviteUserFormDataWithGroups[] = [];
    const failed: { invitation: InviteUserFormDataWithGroups; error: string }[] = [];

    // Process invitations sequentially for better error handling
    for (const invitation of data.manualInvitations) {
      const selectedGroups = groups.filter((g) => invitation.selectedGroups.includes(g.id!));

      try {
        await inviteUserWithGroupsAsync({
          ...invitation,
          organizationId,
          selectedGroups,
        });

        sent.push(invitation);
      } catch (error) {
        failed.push({
          invitation,
          error: error instanceof Error ? error.message : 'Failed to send invitation',
        });
      }
    }

    setInvitationStatus({ sent, failed });

    // Reset form if all succeeded
    if (failed.length === 0) {
      bulkForm.reset({
        manualInvitations: [
          { email: '', firstName: '', lastName: '', selectedGroups: [], invitationNote: '' },
        ],
        defaultGroups: [],
      });

      // Force refresh of organization users data
      await refreshAllUserData(organizationId);

      // Show success message and navigate back
      setTimeout(() => {
        router.push('/user-management/organization-users');
      }, 1500);
    } else {
      // Even if some failed, refresh to show successful additions
      await refreshAllUserData(organizationId);
    }
  };

  // Add invitation row
  const addInvitationRow = () => {
    append({ email: '', firstName: '', lastName: '', selectedGroups: [] });
  };

  // Remove invitation row
  const removeInvitationRow = (index: number) => {
    if (fields.length > 1) {
      remove(index);
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
            <h1 className="text-3xl font-bold tracking-tight">Invite Users</h1>
            <p className="text-muted-foreground">Add new users to {organizationName}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'single' | 'bulk')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Invitation</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Invitations</TabsTrigger>
          </TabsList>

          {/* Single User Invitation */}
          <TabsContent value="single">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Invite Single User
                </CardTitle>
                <CardDescription>
                  Send an invitation to a single user to join your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...singleForm}>
                  <form
                    onSubmit={singleForm.handleSubmit(handleSingleInvite)}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={singleForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
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
                        control={singleForm.control}
                        name="lastName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Doe" disabled={isInvitingWithGroups} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={singleForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
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
                        disabled={isInvitingWithGroups}
                        className="bg-blue-600 hover:bg-blue-700"
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
                        onClick={() => singleForm.reset()}
                        disabled={isInvitingWithGroups}
                      >
                        Clear
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bulk User Invitations */}
          <TabsContent value="bulk">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Bulk Invitations
                </CardTitle>
                <CardDescription>
                  Invite multiple users to your organization at once
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...bulkForm}>
                  <form onSubmit={bulkForm.handleSubmit(handleBulkInvite)} className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-base font-medium">User Invitations</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={addInvitationRow}
                          disabled={isInvitingWithGroups}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Row
                        </Button>
                      </div>

                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>First Name</TableHead>
                              <TableHead>Last Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead className="w-12"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {fields.map((field, index) => (
                              <TableRow key={field.id}>
                                <TableCell>
                                  <FormField
                                    control={bulkForm.control}
                                    name={`manualInvitations.${index}.firstName`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            placeholder="First name"
                                            disabled={isInvitingWithGroups}
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={bulkForm.control}
                                    name={`manualInvitations.${index}.lastName`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            placeholder="Last name"
                                            disabled={isInvitingWithGroups}
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={bulkForm.control}
                                    name={`manualInvitations.${index}.email`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Input
                                            type="email"
                                            placeholder="email@example.com"
                                            disabled={isInvitingWithGroups}
                                            {...field}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeInvitationRow(index)}
                                    disabled={fields.length === 1 || isInvitingWithGroups}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        disabled={isInvitingWithGroups}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isInvitingWithGroups ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                            Sending Invitations...
                          </>
                        ) : (
                          <>
                            <Users className="h-4 w-4 mr-2" />
                            Send All Invitations
                          </>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          bulkForm.reset({
                            manualInvitations: [
                              { email: '', firstName: '', lastName: '', selectedGroups: [] },
                            ],
                          })
                        }
                        disabled={isInvitingWithGroups}
                      >
                        Clear All
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Invitation Status */}
        {(invitationStatus.sent.length > 0 || invitationStatus.failed.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Invitation Status</CardTitle>
              <CardDescription>Review the status of your recent invitations</CardDescription>
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
                          className="flex items-center justify-between p-2 bg-green-100 rounded-md"
                        >
                          <span className="text-sm font-medium">
                            {invitation.firstName} {invitation.lastName} ({invitation.email})
                          </span>
                          <Badge className="bg-green-600 hover:bg-green-700">Sent</Badge>
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {invitationStatus.failed.length > 0 && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">
                    Failed ({invitationStatus.failed.length})
                  </AlertTitle>
                  <AlertDescription className="text-red-700">
                    <div className="space-y-2 mt-2">
                      {invitationStatus.failed.map((failure, index) => (
                        <div key={index} className="p-2 bg-red-100 rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {failure.invitation.firstName} {failure.invitation.lastName} (
                              {failure.invitation.email})
                            </span>
                            <Badge variant="destructive">Failed</Badge>
                          </div>
                          <p className="text-xs text-red-600 mt-1">{failure.error}</p>
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Success Dialog */}
        <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-5 w-5" />
                Invitation Sent Successfully!
              </DialogTitle>
              <DialogDescription>
                The user invitation has been sent successfully. Data is being refreshed
                automatically. You will be redirected to the organization users page.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                Refreshing user data...
              </div>
              <Button
                onClick={async () => {
                  setShowSuccessDialog(false);
                  // Force one more refresh before navigation
                  await refreshAllUserData(organizationId);
                  router.push('/user-management/organization-users');
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Go to Users Page
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
