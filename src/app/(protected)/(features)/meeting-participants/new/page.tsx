import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { MeetingParticipantForm } from "../components/meeting-participant-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/core/auth";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

export const metadata = {
  title: "Create MeetingParticipant",
};

export default function CreateMeetingParticipantPage() {
  return (
    <PermissionGuard 
      requiredPermission="meetingParticipant:create"
      unauthorizedTitle="Access Denied to Create Meeting Participant"
      unauthorizedDescription="You don't have permission to create new meeting participant records."
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
              <h1 className="text-2xl font-semibold text-gray-900">Create Meeting Participant</h1>
              <p className="text-sm text-gray-600 mt-1">Enter the details below to create a new meeting participant</p>
            </div>
          </div>
          
          <MeetingParticipantForm />
        </div>
      </div>
    </PermissionGuard>
  );
}
