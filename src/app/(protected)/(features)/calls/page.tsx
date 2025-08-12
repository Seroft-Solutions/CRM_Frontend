// ===============================================================
// 🛑 MANUALLY MODIFIED FILE - SAFE TO EDIT 🛑
// - Enhanced calls page with meeting scheduler dialog integration
// - Handles URL parameters from call creation to trigger meeting dialog
// ===============================================================
import { Suspense } from 'react';
import { CallsPageWithMeetingDialog } from '@/app/(protected)/(features)/calls/components/calls-page-with-meeting-dialog';
import { PermissionGuard, InlinePermissionGuard } from '@/core/auth';

export const metadata = {
  title: 'Calls',
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
