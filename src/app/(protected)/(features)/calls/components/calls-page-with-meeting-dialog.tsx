'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { CallTable } from '@/app/(protected)/(features)/calls/components/call-table';
import { InlinePermissionGuard, useUserAuthorities } from '@/core/auth';
import { MeetingSchedulerDialog } from '@/app/(protected)/(features)/calls/schedule-meeting/components/meeting-scheduler-dialog';

export function CallsPageWithMeetingDialog() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { hasGroup } = useUserAuthorities();
  const isBusinessPartner = hasGroup('Business Partners');
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [meetingDialogData, setMeetingDialogData] = useState<{
    callId?: number;
    customerId?: number;
    assignedUserId?: string;
  }>({});

  useEffect(() => {
    const created = searchParams.get('created');
    const callId = searchParams.get('callId');
    const customerId = searchParams.get('customerId');
    const assignedUserId = searchParams.get('assignedUserId');

    if (created === 'true' && callId) {
      setMeetingDialogData({
        callId: parseInt(callId, 10),
        customerId: customerId ? parseInt(customerId, 10) : undefined,
        assignedUserId: assignedUserId ? assignedUserId : undefined,
      });

      setShowMeetingDialog(true);

      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('created');
      newUrl.searchParams.delete('callId');
      newUrl.searchParams.delete('customerId');
      newUrl.searchParams.delete('assignedUserId');

      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  const handleCloseMeetingDialog = () => {
    setShowMeetingDialog(false);
    setMeetingDialogData({});
  };

  const handleMeetingScheduled = (meetingData: any) => {
    console.log('Meeting scheduled:', meetingData);
    handleCloseMeetingDialog();
  };

  return (
    <>
      <div className="space-y-4">
        {/* Modern Centered Header with Prominent CTA */}
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-center">
            {/* Left Section: Icon and Title */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
                <svg
                  className="w-4 h-4 text-sidebar-accent-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z M3 7l9 6 9-6"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">Leads</h1>
                <p className="text-sm text-sidebar-foreground/80">Manage your sales pipeline</p>
              </div>
            </div>

            {/* Center Section: Prominent New Lead Button */}
            <div className="flex-1 flex justify-center">
              <InlinePermissionGuard requiredPermission="call:create">
                <Button
                  asChild
                  size="sm"
                  className="h-10 gap-2 bg-sidebar-accent text-sidebar-accent-foreground hover:bg-sidebar-accent/90 hover:scale-105 text-sm font-semibold px-6 shadow-md transition-all duration-200 border-2 border-sidebar-accent/20"
                >
                  <Link href="/calls/new">
                    <Plus className="h-4 w-4" />
                    <span className="hidden sm:inline">New Lead</span>
                  </Link>
                </Button>
              </InlinePermissionGuard>
            </div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        <CallTable />
      </div>

      {/* Meeting Scheduler Dialog */}

      {!isBusinessPartner && (
        <MeetingSchedulerDialog
          open={showMeetingDialog}
          onOpenChangeAction={handleCloseMeetingDialog}
          callId={meetingDialogData.callId}
          customerId={meetingDialogData.customerId}
          assignedUserId={meetingDialogData.assignedUserId}
          onMeetingScheduledAction={handleMeetingScheduled}
          onError={(error) => {
            console.error('Meeting scheduling error:', error);
            handleCloseMeetingDialog();
          }}
        />
      )}
    </>
  );
}
