// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import Link from "next/link";

import { CallTable } from "./components/call-table";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/core/auth";
import { MeetingSchedulerDialog } from "./schedule-meeting/components/meeting-scheduler-dialog";

export default function CallPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showMeetingDialog, setShowMeetingDialog] = useState(false);
  const [callData, setCallData] = useState<{
    callId: string;
    customerId: string;
    assignedUserId: string;
  } | null>(null);

  // Check if we just created a call and should show meeting dialog
  useEffect(() => {
    const created = searchParams.get('created');
    const callId = searchParams.get('callId');
    const customerId = searchParams.get('customerId');
    const assignedUserId = searchParams.get('assignedUserId');

    if (created === 'true' && callId) {
      setCallData({
        callId,
        customerId: customerId || '',
        assignedUserId: assignedUserId || ''
      });
      setShowMeetingDialog(true);
      
      // Clean up URL parameters
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams]);

  const handleMeetingDialogChange = (open: boolean) => {
    setShowMeetingDialog(open);
    if (!open) {
      setCallData(null);
    }
  };

  const handleMeetingScheduled = () => {
    setShowMeetingDialog(false);
    setCallData(null);
  };

  const handleMeetingError = (error: any) => {
    console.error('Meeting scheduling error:', error);
  };
  return (
    <PermissionGuard 
      requiredPermission="call:read"
      unauthorizedTitle="Access Denied to Calls"
      unauthorizedDescription="You don't have permission to view calls."
    >
      <div className={`space-y-4 transition-all duration-300 ${showMeetingDialog ? 'blur-sm pointer-events-none' : ''}`}>
        <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Calls</h1>
                <p className="text-xs text-gray-600 mt-0.5">Manage your calls</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 border-gray-300 hover:bg-gray-50 text-xs"
                aria-label="Refresh List"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <InlinePermissionGuard requiredPermission="call:create">
                <Button asChild size="sm" className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-xs">
                  <Link href="/calls/new">
                    <Plus className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Create</span>
                  </Link>
                </Button>
              </InlinePermissionGuard>
            </div>
          </div>
        </div>

        <Suspense fallback={<div>Loading...</div>}>
          <CallTable />
        </Suspense>
      </div>

      {/* Meeting Scheduler Dialog */}
      {callData && (
        <MeetingSchedulerDialog
          open={showMeetingDialog}
          onOpenChangeAction={handleMeetingDialogChange}
          customerId={callData.customerId ? parseInt(callData.customerId) : undefined}
          assignedUserId={callData.assignedUserId}
          callId={callData.callId ? parseInt(callData.callId) : undefined}
          onMeetingScheduledAction={handleMeetingScheduled}
          onError={handleMeetingError}
        />
      )}
    </PermissionGuard>
  );
}
