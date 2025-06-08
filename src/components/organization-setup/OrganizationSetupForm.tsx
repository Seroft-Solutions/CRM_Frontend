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
    
    // Auto-generate domain from organization name
    const orgName = formData.organizationName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const domain = `${orgName}.crmcup.com`;
    
    await onSubmit({
      organizationName: formData.organizationName.trim(),
      displayName: formData.displayName.trim() || formData.organizationName.trim(),
      domain: domain,
    });
  };

  const handleChange = (field: keyof OrganizationSetupRequest) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
    };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-3">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold">
          Setup Your Organization
        </h1>
        <p className="text-muted-foreground">
          Create your workspace to get started with CRM Cup
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* User Info Card */}
      <Card className="border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <User className="w-5 h-5 mr-2 text-primary" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium">Name</span>
            </div>
            <span className="font-medium">{session?.user?.name || 'User'}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">Email</span>
            </div>
            <span className="font-medium">{session?.user?.email}</span>
          </div>
        </CardContent>
      </Card>

      {/* Organization Setup Form */}
      <Card className="border-primary/20">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg">
            <Building2 className="w-5 h-5 mr-2 text-primary" />
            Organization Details
          </CardTitle>
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
  );
}