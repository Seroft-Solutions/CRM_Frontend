import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

import { MeetingParticipantDetails } from "../components/meeting-participant-details";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

interface MeetingParticipantPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "MeetingParticipant Details",
};

export default async function MeetingParticipantPage({ params }: MeetingParticipantPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="meetingParticipant:read"
      unauthorizedTitle="Access Denied to Meeting Participant Details"
      unauthorizedDescription="You don't have permission to view this meeting participant."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton 
              defaultRoute="/meeting-participants"
              defaultLabel="Back to Meeting Participants"
              entityName="MeetingParticipant"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Meeting Participant Details</h1>
              <p className="text-sm text-gray-600 mt-1">View detailed information for this meeting participant</p>
            </div>
          </div>
          
          <MeetingParticipantDetails id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
