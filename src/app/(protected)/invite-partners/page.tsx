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

interface PartnerInvitation {
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  sendWelcomeEmail: boolean;
  invitationNote?: string;
}

export default function InvitePartnersPage() {
  const router = useRouter();
  const { organizationId, organizationName } = useOrganizationContext();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    invitationNote: '',
    sendWelcomeEmail: true
  });
  
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
      toast.success('Partner invited successfully');
      
      // Clear form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        invitationNote: '',
        sendWelcomeEmail: true
      });

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
      sendWelcomeEmail: true
    });
  };

  return (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invitation Form */}
        <div className="lg:col-span-2">
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
                    id="sendWelcomeEmail"
                    checked={formData.sendWelcomeEmail}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, sendWelcomeEmail: checked as boolean })
                    }
                  />
                  <Label htmlFor="sendWelcomeEmail" className="text-sm">
                    Send welcome email
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  The partner will receive an email with instructions to set up their account
                </p>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button type="submit" disabled={isInviting} className="gap-2">
                    <Mail className="h-4 w-4" />
                    {isInviting ? 'Sending Invitation...' : 'Send Invitation'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleClear}>
                    Clear
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Info Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Partner Privileges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Business Partners</Badge>
                <span className="text-sm text-muted-foreground">
                  Automatic group assignment
                </span>
              </div>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>Partners will have access to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Partner portal</li>
                  <li>Business collaboration tools</li>
                  <li>Shared documents and resources</li>
                  <li>Organization communications</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">How it Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                  1
                </div>
                <p>Partner receives invitation email</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                  2
                </div>
                <p>Partner accepts and sets up account</p>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                  3
                </div>
                <p>Automatic access to partner resources</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
