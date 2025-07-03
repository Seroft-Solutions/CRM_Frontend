/**
 * Enhanced User Creation Component with Dual Storage
 * Creates users in both Keycloak and Spring Database
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  UserPlus,
  Database,
  CheckCircle,
  AlertCircle,
  Loader2,
  Shield,
  Users,
} from 'lucide-react';
import { useDualUserCreation, useAvailableRoles, useAvailableGroups } from '../hooks';
import { ChannelTypeSelector } from '@/features/user-profile-management/components/ChannelTypeSelector';
import type { DualUserCreationData } from '../types';
import { toast } from 'sonner';

const userCreationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  displayName: z.string().optional(),
  selectedGroupIds: z.array(z.string()).default([]),
  selectedRoleIds: z.array(z.string()).default([]),
  channelTypeId: z.number().optional(),
});

type UserCreationFormData = z.infer<typeof userCreationSchema>;

interface DualUserCreationProps {
  organizationId: string;
  organizationName: string;
  onUserCreated?: (userId: string) => void;
  onCancel?: () => void;
  className?: string;
}

export function DualUserCreation({
  organizationId,
  organizationName,
  onUserCreated,
  onCancel,
  className,
}: DualUserCreationProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Hooks
  const { createUser, isCreating, error, isSuccess } = useDualUserCreation();
  const { roles } = useAvailableRoles();
  const { groups } = useAvailableGroups();

  // Form setup
  const form = useForm<UserCreationFormData>({
    resolver: zodResolver(userCreationSchema),
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      displayName: '',
      selectedGroupIds: [],
      selectedRoleIds: [],
    },
  });

  // Handle form submission
  const handleSubmit = async (data: UserCreationFormData) => {
    try {
      // Map form data to dual storage format
      const userData: DualUserCreationData = {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        organizationId,
        phone: data.phone,
        displayName: data.displayName || `${data.firstName} ${data.lastName}`,
        selectedGroups: groups.filter(g => data.selectedGroupIds.includes(g.id!)),
        selectedRoles: roles.filter(r => data.selectedRoleIds.includes(r.id!)),
        channelTypeId: data.channelTypeId,
      };

      const result = await createUser(userData);
      
      if (result.success && result.keycloakResult?.id) {
        form.reset();
        onUserCreated?.(result.keycloakResult.id);
      }
    } catch (error) {
      console.error('User creation failed:', error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    form.reset();
    onCancel?.();
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create User
        </CardTitle>
        <CardDescription>
          Create a new user in both Keycloak and {organizationName} database
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                <h3 className="text-lg font-medium">Basic Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
                          disabled={isCreating}
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
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          disabled={isCreating}
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
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john.doe@example.com"
                        disabled={isCreating}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+1234567890"
                          disabled={isCreating}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="displayName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Name (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John Doe"
                          disabled={isCreating}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Leave empty to use "First Last" format
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Channel Type Selection */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                <h3 className="text-lg font-medium">Profile Settings</h3>
              </div>

              <FormField
                control={form.control}
                name="channelTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel Type</FormLabel>
                    <FormControl>
                      <ChannelTypeSelector
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={isCreating}
                      />
                    </FormControl>
                    <FormDescription>
                      Select the user's channel type for commission tracking
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Advanced Options */}
            <div className="space-y-4">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="p-0 h-auto"
              >
                {showAdvanced ? 'Hide' : 'Show'} Advanced Options
              </Button>

              {showAdvanced && (
                <div className="space-y-4 border-t pt-4">
                  {/* Group Selection */}
                  {groups.length > 0 && (
                    <FormField
                      control={form.control}
                      name="selectedGroupIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Groups
                          </FormLabel>
                          <FormDescription>
                            Select groups to assign to this user
                          </FormDescription>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {groups.map((group) => (
                              <div key={group.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`group-${group.id}`}
                                  checked={field.value.includes(group.id!)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, group.id!]);
                                    } else {
                                      field.onChange(field.value.filter(id => id !== group.id));
                                    }
                                  }}
                                  disabled={isCreating}
                                />
                                <Label 
                                  htmlFor={`group-${group.id}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {group.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Role Selection */}
                  {roles.length > 0 && (
                    <FormField
                      control={form.control}
                      name="selectedRoleIds"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Roles
                          </FormLabel>
                          <FormDescription>
                            Select roles to assign to this user
                          </FormDescription>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {roles.map((role) => (
                              <div key={role.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`role-${role.id}`}
                                  checked={field.value.includes(role.id!)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...field.value, role.id!]);
                                    } else {
                                      field.onChange(field.value.filter(id => id !== role.id));
                                    }
                                  }}
                                  disabled={isCreating}
                                />
                                <Label 
                                  htmlFor={`role-${role.id}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {role.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
            </div>

            {/* Dual Storage Info */}
            <Alert>
              <Database className="h-4 w-4" />
              <AlertTitle>Dual Storage Creation</AlertTitle>
              <AlertDescription>
                This user will be created in both Keycloak (authentication) and Spring Database (application features).
                If one system fails, the other will be rolled back to ensure consistency.
              </AlertDescription>
            </Alert>

            {/* Error Display */}
            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Creation Failed</AlertTitle>
                <AlertDescription className="text-red-700">
                  {error.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isCreating}
                className="flex-1 gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating User...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Create User
                  </>
                )}
              </Button>
              
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
