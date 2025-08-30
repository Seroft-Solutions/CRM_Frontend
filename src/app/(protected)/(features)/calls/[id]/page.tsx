// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
import { CallDetails } from '../components/call-details';
import { PermissionGuard } from '@/core/auth';
import { CallRemarksSection } from '../components/call-remarks-section';
import {CallMeetingsSection} from "@/app/(protected)/(features)/calls/components/call-meetings-section";
import {useGetCall} from "@/core/api/generated/spring";
import { use } from 'react';

interface CallPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Call Details',
};

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
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>

              {/* Title and Description */}
              <div>
                <h1 className="text-xl font-semibold text-white">Call Details</h1>
                <p className="text-blue-100 text-sm">View and manage call information</p>
              </div>
            </div>
          </div>
        </div>

        {/* Call Remarks Section */}
        <div>
          <CallRemarksSection callId={id} />
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
