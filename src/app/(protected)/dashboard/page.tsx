'use client';

import { useEffect, useRef } from 'react';
import { useUserAuthorities } from '@/core/auth/hooks/use-user-authorities';
import { useOrganizationContext, useOrganizationUsers } from '@/features/user-management/hooks';
import { DashboardOverview } from '@/features/dashboard/components/DashboardOverview';
import { BusinessPartnerDashboard } from '@/features/dashboard/components/BusinessPartnerDashboard';
import { SalesmanDashboard } from '@/features/dashboard/components/SalesmanDashboard';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

const normalizeGroupName = (name?: string) => (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const isSalesmanUser = (user: { assignedGroups?: Array<{ name?: string }> }) =>
  (user.assignedGroups || []).some((group) => {
    const normalizedGroupName = normalizeGroupName(group.name);

    return normalizedGroupName === 'salesman' || normalizedGroupName === 'salesmen';
  });

const isSalesManagerUser = (user: { assignedGroups?: Array<{ name?: string }> }) =>
  (user.assignedGroups || []).some((group) => {
    const normalizedGroupName = normalizeGroupName(group.name);

    return normalizedGroupName === 'salesmanager' || normalizedGroupName === 'salesmanagers';
  });

export default function DashboardPage() {
  const { hasGroup, hasRole } = useUserAuthorities();
  const { data: session } = useSession();
  const { organizationId } = useOrganizationContext();
  const {
    users,
    isLoading: isUsersLoading,
    error: usersError,
  } = useOrganizationUsers(organizationId, { page: 1, size: 1000 });
  const loggedOrganizationRef = useRef<string | null>(null);

  const isBusinessPartner = hasGroup('Business Partners');

  const currentUserInOrg = (users || []).find(
    (user: { email?: string; id?: string }) =>
      user.email?.toLowerCase() === session?.user?.email?.toLowerCase() ||
      user.id?.toLowerCase() === session?.user?.id?.toLowerCase()
  );

  const isSalesman = currentUserInOrg ? isSalesmanUser(currentUserInOrg) : false;
  const isSalesManager = currentUserInOrg ? isSalesManagerUser(currentUserInOrg) : false;

  useEffect(() => {
    if (!organizationId || isUsersLoading) return;
    if (loggedOrganizationRef.current === organizationId) return;

    if (usersError) {
      console.warn('Failed to fetch users for Sales group logging:', usersError);
      loggedOrganizationRef.current = organizationId;

      return;
    }

    const salesmanUsers = users.filter(isSalesmanUser);
    const salesManagerUsers = users.filter(isSalesManagerUser);

    console.log('Salesman group users:', salesmanUsers);
    console.log('Salesmanager group users:', salesManagerUsers);
    loggedOrganizationRef.current = organizationId;
  }, [organizationId, users, isUsersLoading, usersError]);

  if (isUsersLoading || isUsersLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isBusinessPartner) {
    return <BusinessPartnerDashboard />;
  }

  const hasSalesmanDashboardAccess = hasRole('salesman-dashboard');

  if (isSalesman && !isSalesManager && hasSalesmanDashboardAccess) {
    return <SalesmanDashboard />;
  }

  if (isSalesman && !isSalesManager && !hasSalesmanDashboardAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <h2 className="text-2xl font-bold text-muted-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground">
          You do not have permission to access the salesman dashboard.
        </p>
      </div>
    );
  }

  return <DashboardOverview />;
}
