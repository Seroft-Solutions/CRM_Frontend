'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, ArrowRight, LogOut } from 'lucide-react';
import type { UserOrganization } from '@/services/organization/organization-api.service';
import { logoutAction } from '@/core/auth';

interface OrganizationSelectorProps {
  organizations: UserOrganization[];
}

export function OrganizationSelector({ organizations }: OrganizationSelectorProps) {
  const [selectedOrgId, setSelectedOrgId] = useState<string>(organizations[0]?.id || '');
  const router = useRouter();

  const handleContinue = () => {
    if (selectedOrgId) {
      const selectedOrg = organizations.find((org) => org.id === selectedOrgId);
      localStorage.setItem('selectedOrganizationId', selectedOrgId);
      localStorage.setItem('selectedOrganizationName', selectedOrg?.name || '');
      console.log('Selected organization:', selectedOrgId, selectedOrg?.name);
      router.push('/dashboard');
    }
  };

  return (
    <div className="relative container mx-auto max-w-2xl py-8">
      {/* Header with logout */}
      <div className="absolute top-4 right-4 z-10">
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </form>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-3">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold">Select Your Organization</h1>
          <p className="text-muted-foreground">
            You belong to multiple organizations. Choose which one to work with.
          </p>
        </div>

        <div className="space-y-3">
          {organizations.map((org) => (
            <Card
              key={org.id}
              className={`cursor-pointer transition-all ${
                selectedOrgId === org.id
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedOrgId(org.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">{org.name}</h3>
                    {org.description && (
                      <p className="text-sm text-muted-foreground truncate">{org.description}</p>
                    )}
                    {org.alias && org.alias !== org.name && (
                      <p className="text-xs text-muted-foreground">Alias: {org.alias}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        selectedOrgId === org.id
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground/30'
                      }`}
                    >
                      {selectedOrgId === org.id && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button onClick={handleContinue} disabled={!selectedOrgId} size="lg" className="w-full">
          Continue to Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
