'use client';

import { CallDetails } from '../components/call-details';
import { PermissionGuard } from '@/core/auth';
import { CallRemarksSection } from '../components/call-remarks-section';
import { CallMeetingsSection } from '@/app/(protected)/(features)/calls/components/call-meetings-section';
import { useGetCall } from '@/core/api/generated/spring';
import { use } from 'react';
import { Eye } from 'lucide-react';

interface CallPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function CallPage({ params }: CallPageProps) {
  const { id: idParam } = use(params);
  const id = parseInt(idParam, 10);

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
        {/* Modern Centered Header for View Page */}
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-center">
            {/* Left Section: Icon and Title */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
                <Eye className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">Call Details</h1>
                <p className="text-sm text-sidebar-foreground/80">View call information and history</p>
              </div>
            </div>

            {/* Center Section: Empty for balance */}
            <div className="flex-1"></div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        {/* Call Remarks Section */}
        <div>
          <CallRemarksSection
            callId={id}
            customerId={callData?.customer?.id}
            sourceId={callData?.source?.id}
            productId={callData?.product?.id}
            priorityId={callData?.priority?.id}
            callTypeId={callData?.callType?.id}
            subCallTypeId={callData?.subCallType?.id}
            callStatusId={callData?.callStatus?.id}
            channelTypeId={callData?.channelType?.id}
            channelPartiesId={callData?.channelParties?.id}
            assignedToId={callData?.assignedTo?.id}
          />
        </div>

        {/* Call Meetings Section */}
        <div>
          <CallMeetingsSection
            callId={id}
            customerId={callData?.customer?.id}
            assignedUserId={callData?.assignedTo?.id}
          />
        </div>

        {/* Call Details Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <CallDetails id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
