import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

import { MeetingReminderDetails } from "../components/meeting-reminder-details";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/core/auth";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

interface MeetingReminderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "MeetingReminder Details",
};

export default async function MeetingReminderPage({ params }: MeetingReminderPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="meetingReminder:read"
      unauthorizedTitle="Access Denied to Meeting Reminder Details"
      unauthorizedDescription="You don't have permission to view this meeting reminder."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton 
              defaultRoute="/meeting-reminders"
              defaultLabel="Back to Meeting Reminders"
              entityName="MeetingReminder"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Meeting Reminder Details</h1>
              <p className="text-sm text-gray-600 mt-1">View detailed information for this meeting reminder</p>
            </div>
          </div>
          
          <MeetingReminderDetails id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
