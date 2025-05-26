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
import { useInviteUser, useOrganizationContext } from '../hooks';
import { PermissionGuard } from '@/components/auth/permission-guard';
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
  Users
} from 'lucide-react';
import type { InviteUserFormData, BulkInviteFormData } from '../types';
import { toast } from 'sonner';

// Form validation schemas
const inviteUserSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  sendWelcomeEmail: z.boolean().default(true),
});

const bulkInviteSchema = z.object({
  manualInvitations: z.array(inviteUserSchema).min(1, 'At least one invitation is required'),
});

interface InviteUsersProps {
  className?: string;
}

export function InviteUsers({ className }: InviteUsersProps) {
  const router = useRouter();
  const { organizationId, organizationName } = useOrganizationContext();
  const { inviteUser, isInviting } = useInviteUser();

  // Local state
  const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
  const [invitationStatus, setInvitationStatus] = useState<{
    sent: InviteUserFormData[];
    failed: { invitation: InviteUserFormData; error: string }[];
  }>({ sent: [], failed: [] });

  // Single invitation form
  const singleForm = useForm<InviteUserFormData>({
    resolver: zodResolver(inviteUserSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      sendWelcomeEmail: true,
    },
  });

  // Bulk invitation form
  const bulkForm = useForm<BulkInviteFormData>({
    resolver: zodResolver(bulkInviteSchema),
    defaultValues: {
      manualInvitations: [
        { email: '', firstName: '', lastName: '', sendWelcomeEmail: true }
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: bulkForm.control,
    name: 'manualInvitations',
  });

  // Handle single user invitation
  const handleSingleInvite = async (data: InviteUserFormData) => {
    try {
      await inviteUser({
        ...data,
        organizationId,
      });
      
      singleForm.reset();
      toast.success(`Invitation sent to ${data.email}`);
      
      // Add to sent list
      setInvitationStatus(prev => ({
        ...prev,
        sent: [...prev.sent, data],
      }));
    } catch (error) {
      toast.error('Failed to send invitation');
    }
  };

  // Handle bulk invitations
  const handleBulkInvite = async (data: BulkInviteFormData) => {
    const sent: InviteUserFormData[] = [];
    const failed: { invitation: InviteUserFormData; error: string }[] = [];

    for (const invitation of data.manualInvitations) {
      try {
        await inviteUser({
          ...invitation,
          organizationId,
        });
        sent.push(invitation);
      } catch (error) {
        failed.push({
          invitation,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    setInvitationStatus({ sent, failed });
    
    if (sent.length > 0) {
      toast.success(`${sent.length} invitation${sent.length > 1 ? 's' : ''} sent successfully`);
    }
    
    if (failed.length > 0) {
      toast.error(`${failed.length} invitation${failed.length > 1 ? 's' : ''} failed`);
    }

    // Reset form if all succeeded
    if (failed.length === 0) {
      bulkForm.reset({
        manualInvitations: [
          { email: '', firstName: '', lastName: '', sendWelcomeEmail: true }
        ],
      });
    }
  };

  // Add invitation row
  const addInvitationRow = () => {
    append({ email: '', firstName: '', lastName: '', sendWelcomeEmail: true });
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
    <PermissionGuard requiredPermission="manage-users">
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Invite Users</h1>
            <p className="text-muted-foreground">
              Add new users to {organizationName}
            </p>
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
                  <form onSubmit={singleForm.handleSubmit(handleSingleInvite)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={singleForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="John" {...field} />
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
                              <Input placeholder="Doe" {...field} />
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
                            <Input type="email" placeholder="john.doe@example.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={singleForm.control}
                      name="sendWelcomeEmail"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Send welcome email</FormLabel>
                            <FormDescription>
                              The user will receive an email with instructions to set up their account
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <Button type="submit" disabled={isInviting} className="gap-2">
                        {isInviting ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send Invitation
                          </>
                        )}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => singleForm.reset()}>
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
                        <Button type="button" variant="outline" size="sm" onClick={addInvitationRow}>
                          <Plus className="h-4 w-4 mr-2" />
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
                              <TableHead>Welcome Email</TableHead>
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
                                          <Input placeholder="First name" {...field} />
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
                                          <Input placeholder="Last name" {...field} />
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
                                          <Input type="email" placeholder="email@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </TableCell>
                                <TableCell>
                                  <FormField
                                    control={bulkForm.control}
                                    name={`manualInvitations.${index}.sendWelcomeEmail`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                          />
                                        </FormControl>
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
                                    disabled={fields.length === 1}
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
                      <Button type="submit" disabled={isInviting} className="gap-2">
                        {isInviting ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Sending Invitations...
                          </>
                        ) : (
                          <>
                            <Mail className="h-4 w-4" />
                            Send All Invitations
                          </>
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => bulkForm.reset({
                          manualInvitations: [
                            { email: '', firstName: '', lastName: '', sendWelcomeEmail: true }
                          ],
                        })}
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
              <CardDescription>
                Review the status of your recent invitations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {invitationStatus.sent.length > 0 && (
                <div>
                  <h4 className="font-medium text-green-700 mb-2">
                    Successfully Sent ({invitationStatus.sent.length})
                  </h4>
                  <div className="space-y-2">
                    {invitationStatus.sent.map((invitation, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded-md">
                        <span className="text-sm">
                          {invitation.firstName} {invitation.lastName} ({invitation.email})
                        </span>
                        <Badge variant="default" className="bg-green-600">Sent</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {invitationStatus.failed.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-700 mb-2">
                    Failed ({invitationStatus.failed.length})
                  </h4>
                  <div className="space-y-2">
                    {invitationStatus.failed.map((failure, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded-md">
                        <div>
                          <span className="text-sm">
                            {failure.invitation.firstName} {failure.invitation.lastName} ({failure.invitation.email})
                          </span>
                          <p className="text-xs text-red-600">{failure.error}</p>
                        </div>
                        <Badge variant="destructive">Failed</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </PermissionGuard>
  );
}
