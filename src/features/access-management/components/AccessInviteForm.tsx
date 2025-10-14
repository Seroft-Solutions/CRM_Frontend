'use client';

import { useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  useAvailableGroups,
  useAvailableRoles,
  useOrganizationContext,
} from '@/features/user-management/hooks/client';
import { ChannelTypeSelector } from '@/features/user-profile-management/components/ChannelTypeSelector';
import { RoleGroupSelector } from './RoleGroupSelector';
import { useAccessInvite } from '@/features/access-management/hooks';
import { useGetChannelType } from '@/core/api/generated/spring/endpoints/channel-type-resource/channel-type-resource.gen';
import type {
  AccessInviteType,
  PartnerAccessMetadata,
  StaffAccessMetadata,
} from '@/features/access-management/types';

const staffSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  roles: z.array(z.string()).optional(),
  groups: z.array(z.string()).min(1, 'Select at least one group'),
  note: z.string().optional(),
});

const partnerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email'),
  channelTypeId: z.number().int().positive(),
  commissionPercent: z.number().min(0).max(100).optional(),
  note: z.string().optional(),
});

type StaffFormValues = z.infer<typeof staffSchema>;
type PartnerFormValues = z.infer<typeof partnerSchema>;

interface AccessInviteFormProps {
  type: AccessInviteType;
  className?: string;
  organizationId?: string;
  organizationName?: string;
}

export function AccessInviteForm({
  type,
  className,
  organizationId: organizationIdProp,
  organizationName,
}: AccessInviteFormProps) {
  const { organizationId: contextOrgId, organizationName: contextOrgName } =
    useOrganizationContext();

  const organizationId = organizationIdProp ?? contextOrgId;
  const resolvedOrgName = organizationName ?? contextOrgName;

  const {
    roles: availableRoles,
    isLoading: rolesLoading,
  } = useAvailableRoles();
  const {
    groups: availableGroups,
    isLoading: groupsLoading,
  } = useAvailableGroups();

  const staffInvite = useAccessInvite<StaffAccessMetadata>();
  const partnerInvite = useAccessInvite<PartnerAccessMetadata>();

  const isInviting = type === 'user' ? staffInvite.isInviting : partnerInvite.isInviting;

  const staffForm = useForm<StaffFormValues>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      roles: [],
      groups: [],
      note: '',
    },
  });

  const partnerForm = useForm<PartnerFormValues>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      note: '',
    },
  });

  // Get selected channel type details for partner form (after form initialization)
  const selectedChannelTypeId = partnerForm.watch('channelTypeId');
  const { data: selectedChannelType } = useGetChannelType(
    selectedChannelTypeId ?? 0,
    {
      query: {
        enabled: type === 'partner' && !!selectedChannelTypeId,
      },
    }
  );

  // Auto-populate commission rate when channel type changes
  useEffect(() => {
    if (type === 'partner' && selectedChannelType?.commissionRate !== undefined) {
      partnerForm.setValue('commissionPercent', selectedChannelType.commissionRate);
    }
  }, [selectedChannelType, type, partnerForm]);

  const loadingMessage = useMemo(() => {
    if (rolesLoading || groupsLoading) return 'Loading reference data...';
    if (!organizationId) return 'Select an organization to continue.';
    return null;
  }, [rolesLoading, groupsLoading, organizationId]);

  const handleSubmitStaff = async (values: StaffFormValues) => {
    if (!organizationId) {
      toast.error('Organization context missing');
      return;
    }

    const uniqueGroupIds = Array.from(new Set(values.groups));
    const uniqueRoleIds = values.roles ? Array.from(new Set(values.roles)) : [];

    const metadata: StaffAccessMetadata = {
      groups: uniqueGroupIds.map((groupId) => {
        const group = availableGroups.find((item) => item.id === groupId);
        return {
          id: groupId,
          name: group?.name,
        };
      }),
      roles: uniqueRoleIds.length > 0 ? uniqueRoleIds.map((roleId) => {
        const role = availableRoles.find((item) => item.id === roleId);
        return {
          id: roleId,
          name: role?.name,
        };
      }) : undefined,
      note: values.note?.trim() ? values.note.trim() : undefined,
    };

    await staffInvite.sendInviteAsync({
      type: 'user',
      organizationId,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      metadata,
    });

    staffForm.reset();
  };

  const handleSubmitPartner = async (values: PartnerFormValues) => {
    if (!organizationId) {
      toast.error('Organization context missing');
      return;
    }

    const metadata: PartnerAccessMetadata = {
      channelType: {
        id: values.channelTypeId,
      },
      commissionPercent: values.commissionPercent,
      groups: [], // Business Partner group is automatically assigned by backend
      note: values.note?.trim() ? values.note.trim() : undefined,
    };

    await partnerInvite.sendInviteAsync({
      type: 'partner',
      organizationId,
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      metadata,
    });

    partnerForm.reset();
  };

  if (loadingMessage) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        {loadingMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-5">
        <h2 className="text-xl font-semibold tracking-tight">
          {type === 'user' ? 'Invite Team Member' : 'Invite Business Partner'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Send an invitation to join {resolvedOrgName || 'the organization'}.
        </p>
      </div>

      {type === 'user' ? (
        <Form {...staffForm}>
          <form
            className="space-y-5"
            onSubmit={staffForm.handleSubmit(handleSubmitStaff)}
          >
            {/* Personal Information Section */}
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3 text-foreground">Personal Information</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={staffForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={staffForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Smith" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={staffForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="jane.smith@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Access & Permissions Section */}
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3 text-foreground">Access & Permissions</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={staffForm.control}
                  name="roles"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RoleGroupSelector
                          type="roles"
                          available={availableRoles}
                          selected={availableRoles.filter((r) => field.value?.includes(r.id!))}
                          onSelectionChange={(selected) => field.onChange(selected.map((r) => r.id!))}
                          label="Roles"
                          description="Select roles for this user (optional)"
                          required={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={staffForm.control}
                  name="groups"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <RoleGroupSelector
                          type="groups"
                          available={availableGroups}
                          selected={availableGroups.filter((g) => field.value?.includes(g.id!))}
                          onSelectionChange={(selected) => field.onChange(selected.map((g) => g.id!))}
                          label="Groups"
                          description="Select at least one group for this user"
                          required={true}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3 text-foreground">Additional Information</h3>
              <FormField
                control={staffForm.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Add a personal message..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => staffForm.reset()}
                disabled={isInviting}
              >
                Clear
              </Button>
              <Button type="submit" disabled={!staffForm.formState.isValid || isInviting}>
                {isInviting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        </Form>
      ) : (
        <Form {...partnerForm}>
          <form
            className="space-y-5"
            onSubmit={partnerForm.handleSubmit(handleSubmitPartner)}
          >
            {/* Personal Information Section */}
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3 text-foreground">Personal Information</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={partnerForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Taylor" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={partnerForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Johnson" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={partnerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="taylor.johnson@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Partnership Details Section */}
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3 text-foreground">Partnership Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={partnerForm.control}
                  name="channelTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Channel Type</FormLabel>
                      <FormControl>
                        <ChannelTypeSelector
                          value={field.value}
                          onValueChange={(value) => field.onChange(value ?? undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={partnerForm.control}
                  name="commissionPercent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission Rate</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type="text"
                            value={field.value !== undefined ? `${field.value}%` : 'Select channel type'}
                            readOnly
                            disabled
                            className="bg-muted cursor-not-allowed"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Auto-assigned group info within the section */}
              {/*<div className="mt-4 rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 px-3 py-2.5">*/}
              {/*  <div className="flex items-start gap-2">*/}
              {/*    <Badge variant="outline" className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">Auto-assigned</Badge>*/}
              {/*    <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">*/}
              {/*      Business Partner group will be automatically assigned upon invitation acceptance*/}
              {/*    </p>*/}
              {/*  </div>*/}
              {/*</div>*/}
            </div>

            {/* Additional Information Section */}
            <div className="rounded-lg border bg-card p-4 shadow-sm">
              <h3 className="text-sm font-semibold mb-3 text-foreground">Additional Information</h3>
              <FormField
                control={partnerForm.control}
                name="note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Add context for the partner..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => partnerForm.reset()}
                disabled={isInviting}
              >
                Clear
              </Button>
              <Button type="submit" disabled={!partnerForm.formState.isValid || isInviting}>
                {isInviting ? 'Sending...' : 'Send Invitation'}
              </Button>
            </div>
          </form>
        </Form>
      )}

      <div className="mt-5 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 px-4 py-3">
        <div className="flex items-start gap-3">
          <Badge variant="outline" className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700">Tip</Badge>
          <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
            Invitations expire after 24 hours. Resend from the access dashboard if needed.
          </p>
        </div>
      </div>
    </div>
  );
}
