/**
 * Invite Partners Page
 * Partner invitation with "Business Partners" group assignment
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Mail, 
  Plus,
  ArrowLeft,
  Building2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useOrganizationContext } from '@/features/user-management/hooks';
import { ChannelTypeSelector } from '@/features/user-profile-management/components/ChannelTypeSelector';
import { useUserProfilePersistence } from '@/features/user-profile-management/hooks/useUserProfilePersistence';
import { PermissionGuard } from '@/components/auth/permission-guard';

interface PartnerInvitation {
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  sendWelcomeEmail: boolean;
  sendPasswordReset?: boolean;
  invitationNote?: string;
  redirectUri?: string;
}

export default function InvitePartnersPage() {
  const router = useRouter();
  const { organizationId, organizationName } = useOrganizationContext();
  const { createProfileForPartner, isCreating: isCreatingProfile } = useUserProfilePersistence();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    invitationNote: '',
    sendWelcomeEmail: false,
    sendPasswordReset: true
  });
  
  const [channelTypeId, setChannelTypeId] = useState<number | undefined>(undefined);
  const [isInviting, setIsInviting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organizationId) {
      toast.error('No organization selected');
      return;
    }

    setIsInviting(true);

    try {
      const invitation: PartnerInvitation = {
        ...formData,
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
          formData.email,
          formData.firstName,
          formData.lastName,
          channelTypeId
        );
      }
      
      // Show appropriate success message based on email type
      const emailMessage = result.emailType === 'password_reset' 
        ? 'Partner invited successfully. Password setup email sent.'
        : 'Partner invited successfully';
      
      const groupMessage = result.groupManagement?.message 
        ? ` ${result.groupManagement.message}`
        : '';
      
      toast.success(emailMessage + groupMessage);
      
      // Clear form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        invitationNote: '',
        sendWelcomeEmail: false,
        sendPasswordReset: true
      });
      setChannelTypeId(undefined);

    } catch (error) {
      console.error('Failed to invite partner:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to invite partner');
    } finally {
      setIsInviting(false);
    }
  };

  const handleClear = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      invitationNote: '',
      sendWelcomeEmail: false,
      sendPasswordReset: true
    });
    setChannelTypeId(undefined);
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
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invite Partners</h1>
          <p className="text-muted-foreground">
            Add business partners to {organizationName}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Invite Business Partner
          </CardTitle>
          <CardDescription>
            Send an invitation to a business partner to join your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      placeholder="Enter first name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      placeholder="Enter last name"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                  />
                </div>

                {/* Channel Type */}
                <div className="space-y-2">
                  <Label htmlFor="channelType">Channel Type</Label>
                  <ChannelTypeSelector
                    value={channelTypeId}
                    onValueChange={setChannelTypeId}
                    disabled={isInviting || isCreatingProfile}
                  />
                </div>

                {/* Invitation Note */}
                <div className="space-y-2">
                  <Label htmlFor="invitationNote">Invitation Note (Optional)</Label>
                  <Input
                    id="invitationNote"
                    value={formData.invitationNote}
                    onChange={(e) => setFormData({ ...formData, invitationNote: e.target.value })}
                    placeholder="Add a personal note to the invitation"
                  />
                </div>

                {/* Send Email Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendPasswordReset"
                    checked={formData.sendPasswordReset}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, sendPasswordReset: checked as boolean })
                    }
                  />
                  <Label htmlFor="sendPasswordReset" className="text-sm">
                    Send password setup email
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  The partner will receive an email to set up their password and access their account
                </p>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={isInviting || isCreatingProfile} className="gap-2">
                    <Mail className="h-4 w-4" />
                    {isInviting || isCreatingProfile ? 'Processing...' : 'Send Invitation'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleClear} disabled={isInviting || isCreatingProfile}>
                    Clear
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
    </div>
    </PermissionGuard>
  );
}
