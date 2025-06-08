'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Building2, 
  Loader2, 
  User, 
  Mail,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { OrganizationSetupRequest } from '@/services/organization/organization-setup.service';

interface OrganizationSetupFormProps {
  onSubmit: (request: OrganizationSetupRequest) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function OrganizationSetupForm({
  onSubmit,
  isLoading = false,
  error
}: OrganizationSetupFormProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<OrganizationSetupRequest>({
    organizationName: '',
    displayName: '',
    domain: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.organizationName.trim()) return;
    
    await onSubmit({
      organizationName: formData.organizationName.trim(),
      displayName: formData.displayName.trim() || formData.organizationName.trim(),
      domain: formData.domain.trim() || undefined,
    });
  };

  const handleChange = (field: keyof OrganizationSetupRequest) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">
          Setup Your Organization
        </h1>
        <p className="text-lg text-muted-foreground">
          Create your workspace to get started with CRM Cup
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <User className="w-5 h-5 mr-2 text-primary" />
              User Information
            </CardTitle>
            <CardDescription>Your account details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1 text-green-600" />
                Name
              </Label>
              <div className="p-3 bg-muted rounded-md">
                <span className="font-medium">{session?.user?.name || 'User'}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center">
                <Mail className="w-4 h-4 mr-1 text-blue-600" />
                Email
              </Label>
              <div className="p-3 bg-muted rounded-md">
                <span className="font-medium">{session?.user?.email}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization Setup Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Building2 className="w-5 h-5 mr-2 text-primary" />
              Organization Details
            </CardTitle>
            <CardDescription>Configure your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName" className="text-sm font-medium">
                  Organization Name *
                </Label>
                <Input
                  id="orgName"
                  type="text"
                  value={formData.organizationName}
                  onChange={handleChange('organizationName')}
                  placeholder="Enter organization name"
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName" className="text-sm font-medium">
                  Display Name
                </Label>
                <Input
                  id="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={handleChange('displayName')}
                  placeholder="Friendly display name (optional)"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain" className="text-sm font-medium">
                  Domain
                </Label>
                <Input
                  id="domain"
                  type="text"
                  value={formData.domain}
                  onChange={handleChange('domain')}
                  placeholder="company.com (optional)"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoading || !formData.organizationName.trim()}
                className="w-full"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Organization...
                  </>
                ) : (
                  'Create Organization'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-foreground mb-2">What happens next?</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                <div className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                  Create organization workspace
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                  Set up user profile
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                  Configure admin permissions
                </div>
                <div className="flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
                  Initialize default data
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}