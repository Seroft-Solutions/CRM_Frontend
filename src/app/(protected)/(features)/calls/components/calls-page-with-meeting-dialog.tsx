'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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

  // Check for URL parameters that indicate a call was just created
  useEffect(() => {
    const created = searchParams.get('created');
    const callId = searchParams.get('callId');
    const customerId = searchParams.get('customerId');
    const assignedUserId = searchParams.get('assignedUserId');

    if (created === 'true' && callId) {
      // Set up meeting dialog data
      setMeetingDialogData({
        callId: parseInt(callId, 10),
        customerId: customerId ? parseInt(customerId, 10) : undefined,
        assignedUserId: assignedUserId ? assignedUserId : undefined,
      });

      // Show the meeting dialog
      setShowMeetingDialog(true);

      // Clean up URL parameters
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('created');
      newUrl.searchParams.delete('callId');
      newUrl.searchParams.delete('customerId');
      newUrl.searchParams.delete('assignedUserId');

      // Replace the URL without refreshing the page
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  const handleCloseMeetingDialog = () => {
    setShowMeetingDialog(false);
    setMeetingDialogData({});
  };

  const handleMeetingScheduled = (meetingData: any) => {
    // Handle successful meeting scheduling
    console.log('Meeting scheduled:', meetingData);
    handleCloseMeetingDialog();
  };

  return (
    <>
      <div className="space-y-4">
        {/* Professional Header with Dotted Background */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 shadow-lg relative overflow-hidden">
          {/* Dotted background pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          ></div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center border border-white/30">
                <svg
                  className="w-5 h-5 text-white"
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

              <div className="text-white">
                <h1 className="text-2xl font-bold">Leads</h1>
                <p className="text-blue-100">Manage your calls/leeds</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-white/30 bg-white/10 text-white hover:bg-white/20 text-xs backdrop-blur-sm"
                aria-label="Refresh List"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <InlinePermissionGuard requiredPermission="call:create">
                <Button
                  asChild
                  size="sm"
                  className="h-8 gap-1.5 bg-white text-blue-600 hover:bg-blue-50 text-xs font-medium"
                >
                  <Link href="/calls/new">
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Create</span>
                  </Link>
                </Button>
              </InlinePermissionGuard>
            </div>
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
