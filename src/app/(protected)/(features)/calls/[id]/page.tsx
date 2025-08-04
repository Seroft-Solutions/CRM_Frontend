'use client';
// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { use } from "react";

import { CallDetails } from "@/app/(protected)/(features)/calls/components/call-details";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/core/auth";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";
import { CallRemarksSection } from "@/app/(protected)/(features)/calls/components/call-remarks-section";
import { CallMeetingsSection } from "@/app/(protected)/(features)/calls/components/call-meetings-section";
import { useGetCall } from "@/core/api/generated/spring/endpoints/call-resource/call-resource.gen";

interface CallPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CallPage({ params }: CallPageProps) {
  const { id: idParam } = use(params);
  const id = parseInt(idParam, 10);

  // Fetch call data to get customer and assigned user info
  const { data: callData } = useGetCall(id, {
    query: {
      enabled: !!id,
    },
  });

  return (
      <PermissionGuard
          requiredPermission="call:read"
          unauthorizedTitle="Access Denied to Call Details"
          unauthorizedDescription="You don't have permission to view this call."
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <PageHeader>
              <ContextAwareBackButton
                  defaultRoute="/calls"
                  defaultLabel="Back to Calls"
                  entityName="Call"
              />
            </PageHeader>
          </div>

          {/* Call Remarks Section */}
          <div className="mt-6">
            <CallRemarksSection callId={id} />
          </div>

          {/* Call Meetings Section */}
          <div className="mt-6">
            <CallMeetingsSection
                callId={id}
                customerId={callData?.customer?.id}
                assignedUserId={callData?.assignedTo?.id}
            />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Call Details</h1>
                <p className="text-sm text-gray-600 mt-1">View detailed information for this call</p>
              </div>
            </div>

            <CallDetails id={id} />
          </div>
        </div>
      </PermissionGuard>
  );
}
