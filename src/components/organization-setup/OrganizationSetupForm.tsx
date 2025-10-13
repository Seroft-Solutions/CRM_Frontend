'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Loader2, User, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import type { OrganizationSetupRequest } from '@/services/organization/organization-setup.service';

interface OrganizationSetupFormProps {
  onSubmit: (request: OrganizationSetupRequest) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function OrganizationSetupForm({
  onSubmit,
  isLoading = false,
  error,
}: OrganizationSetupFormProps) {
  const { data: session } = useSession();
  const [formData, setFormData] = useState<OrganizationSetupRequest>({
    organizationName: '',
    domain: '',
    organizationCode: '',
    organizationEmail:session?.user?.email,
  });
  const [validationError, setValidationError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!formData.organizationName.trim() || !formData.organizationCode.trim()) {
      return;
    }

    // Validate organization name - no spaces allowed
    if (formData.organizationName.includes(' ')) {
      setValidationError('Organization name cannot contain spaces');
      return;
    }

    // Validate organization code
    const orgCodeRegex = /^(?=.*[A-Z])(?=.*[0-9])[A-Z0-9]{4}$/;
    if (!orgCodeRegex.test(formData.organizationCode as string)) {
      setValidationError(
        'Organization code must be 4 characters long, contain at least one uppercase letter and one number, and no special characters.'
      );
      return;
    }

    // Auto-generate domain from organization name
    const orgName = formData.organizationName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const domain = `${orgName}.crmcup.com`;

    await onSubmit({
      organizationName: formData.organizationName.trim(),
      domain,
      organizationCode: formData.organizationCode,
      organizationEmail: session?.user?.email || '',
    });
  };


  const handleChange =
    (field: keyof OrganizationSetupRequest) => (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value;
      if (field === 'organizationCode') {
        value = value.toUpperCase();
      }
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear validation error when user starts typing
      if (validationError && (field === 'organizationName' || field === 'organizationCode')) {
        setValidationError('');
      }
    };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-3">
          <Building2 className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold">Setup Your Organization</h1>
        <p className="text-muted-foreground">Create your workspace to get started with CRM Cup</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationError}</AlertDescription>
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
              <p className="text-xs text-muted-foreground">
                Organization name cannot contain spaces
              </p>

              <Label htmlFor="orgCode" className="text-sm font-medium">
                Organization Code *
              </Label>
              <Input
                id="orgCode"
                type="text"
                value={formData.organizationCode}
                onChange={handleChange('organizationCode')}
                placeholder="Enter organization code"
                required
                disabled={isLoading}
                maxLength={4}
              />
              <p className="text-xs text-muted-foreground">
                Must be 4 characters, at least one uppercase letter and one number, no special
                characters.
              </p>
            </div>

            <Button
              type="submit"
              disabled={
                isLoading || !formData.organizationName.trim() || !formData.organizationCode.trim()
              }
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
