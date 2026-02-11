'use client';

import { useEffect, useRef } from 'react';
import { useUserAuthorities } from '@/core/auth/hooks/use-user-authorities';
import { useOrganizationContext, useOrganizationUsers } from '@/features/user-management/hooks';
import { DashboardOverview } from '@/features/dashboard/components/DashboardOverview';
import { BusinessPartnerDashboard } from '@/features/dashboard/components/BusinessPartnerDashboard';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { hasGroup, isLoading } = useUserAuthorities();
  const { organizationId } = useOrganizationContext();
  const {
    users,
    isLoading: isUsersLoading,
    error: usersError,
  } = useOrganizationUsers(organizationId, { page: 1, size: 1000 });
  const loggedOrganizationRef = useRef<string | null>(null);

  const isBusinessPartner = hasGroup('Business Partners');

  useEffect(() => {
    if (!organizationId || isUsersLoading) return;
    if (loggedOrganizationRef.current === organizationId) return;

    if (usersError) {
      console.warn('Failed to fetch users for Salesman group logging:', usersError);
      loggedOrganizationRef.current = organizationId;

      return;
    }

    const salesmanUsers = users.filter((user) =>
      (user.assignedGroups || []).some((group) =>
        (group.name || '').toLowerCase().includes('salesman')
      )
    );
    const salesManagerUsers = users.filter((user) =>
      (user.assignedGroups || []).some((group) =>
        (group.name || '').toLowerCase().includes('sales manager')
      )
    );

    console.log('Salesman group users:', salesmanUsers);
    console.log('Salesmanager group users:', salesManagerUsers);
    loggedOrganizationRef.current = organizationId;
  }, [organizationId, users, isUsersLoading, usersError]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isBusinessPartner) {
    return <BusinessPartnerDashboard />;
  }

  return <DashboardOverview />;
}
