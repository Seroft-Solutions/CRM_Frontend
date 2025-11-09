import { Suspense } from 'react';
import { PermissionGuard } from '@/core/auth';
import { CallsPageWithMeetingDialog } from '@/app/(protected)/(features)/calls/components/calls-page-with-meeting-dialog';

export const metadata = {
  title: 'Leads',
};

export default function CallPage() {
  return (
    <PermissionGuard
      requiredPermission="call:read"
      unauthorizedTitle="Access Denied to Calls"
      unauthorizedDescription="You don't have permission to view calls."
    >
      <Suspense fallback={<div>Loading...</div>}>
        <CallsPageWithMeetingDialog />
      </Suspense>
    </PermissionGuard>
  );
}
