'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowRight, LogOut, Search } from 'lucide-react';
import { CrmCupLogo } from '@/components/branding/crm-cup-logo';
import { useSession } from 'next-auth/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { UserOrganization } from '@/services/organization/organization-api.service';
import { logoutAction } from '@/core/auth';

interface OrganizationSelectorProps {
  organizations: UserOrganization[];
}

export function OrganizationSelector({ organizations }: OrganizationSelectorProps) {
  const [selectedOrgId, setSelectedOrgId] = useState<string>(organizations[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: session } = useSession();
  const router = useRouter();
  const currentUserEmail = session?.user?.email?.trim().toLowerCase() || '';

  const filteredOrganizations = useMemo(() => {
    if (!searchQuery.trim()) return organizations;

    const query = searchQuery.toLowerCase();

    return organizations.filter(
      (org) =>
        org.name.toLowerCase().includes(query) ||
        (org.alias && org.alias.toLowerCase().includes(query)) ||
        (org.description && org.description.toLowerCase().includes(query)) ||
        (org.email && org.email.toLowerCase().includes(query))
    );
  }, [organizations, searchQuery]);

  const handleContinue = () => {
    if (selectedOrgId) {
      const selectedOrg = organizations.find((org) => org.id === selectedOrgId);

      localStorage.setItem('selectedOrganizationId', selectedOrgId);
      localStorage.setItem('selectedOrganizationName', selectedOrg?.name || '');

      document.cookie = `selectedOrganizationId=${selectedOrgId}; path=/; max-age=31536000; SameSite=Lax`;
      document.cookie = `selectedOrganizationName=${encodeURIComponent(selectedOrg?.name || '')}; path=/; max-age=31536000; SameSite=Lax`;

      console.log(
        'Selected organization set in localStorage and cookies:',
        selectedOrgId,
        selectedOrg?.name
      );
      router.push('/dashboard');
    }
  };

  return (
    <div className="relative container mx-auto max-w-4xl py-8">
      <div className="absolute top-4 right-4 z-10">
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm" className="flex items-center gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </form>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 text-primary mb-3 ring-1 ring-primary/10">
            <CrmCupLogo className="w-16 h-16" />
          </div>
          <h1 className="text-2xl font-bold">Select Your Organization</h1>
          <p className="text-muted-foreground">
            You belong to multiple organizations. Choose which one to work with.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, alias or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {filteredOrganizations.length} of {organizations.length} organizations
          </div>
        </div>

        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">Select</TableHead>
                <TableHead>Organization Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="w-20">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrganizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No organizations found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrganizations.map((org) => {
                  const organizationEmail = org.email?.trim().toLowerCase() || '';
                  const isEmailMismatch =
                    Boolean(currentUserEmail) &&
                    Boolean(organizationEmail) &&
                    organizationEmail !== currentUserEmail;

                  return (
                    <TableRow
                      key={org.id}
                      className={`cursor-pointer ${
                        selectedOrgId === org.id
                          ? isEmailMismatch
                            ? 'bg-amber-50'
                            : 'bg-primary/5'
                          : isEmailMismatch
                            ? 'bg-amber-50/60'
                            : ''
                      }`}
                      onClick={() => setSelectedOrgId(org.id)}
                    >
                      <TableCell>
                        <div
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedOrgId === org.id
                              ? 'bg-primary border-primary'
                              : 'border-muted-foreground/30'
                          }`}
                        >
                          {selectedOrgId === org.id && (
                            <div className="w-2 h-2 bg-white rounded-full" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{org.name}</TableCell>
                      <TableCell
                        className={
                          isEmailMismatch ? 'font-medium text-amber-700' : 'text-muted-foreground'
                        }
                      >
                        {org.email || '-'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            org.enabled !== false
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {org.enabled !== false ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {currentUserEmail && (
          <p className="text-xs text-muted-foreground">
            Rows highlighted in amber have an organization email that does not match your current
            logged-in email.
          </p>
        )}

        <Button onClick={handleContinue} disabled={!selectedOrgId} size="lg" className="w-full">
          Continue to Dashboard
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
