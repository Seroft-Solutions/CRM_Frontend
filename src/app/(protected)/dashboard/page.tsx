'use client';

import { useUserAuthorities } from '@/core/auth/hooks/use-user-authorities';
import { DashboardOverview } from '@/features/dashboard/components/DashboardOverview';
import { BusinessPartnerDashboard } from '@/features/dashboard/components/BusinessPartnerDashboard';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { hasGroup, isLoading } = useUserAuthorities();

  // Check if user is a business partner
  const isBusinessPartner = hasGroup('Business Partners');

  // Show loading state while checking user group
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show Business Partner Dashboard if user is in Business Partners group
  if (isBusinessPartner) {
    return <BusinessPartnerDashboard />;
  }

  // Show regular dashboard for other users
  return <DashboardOverview />;
}
