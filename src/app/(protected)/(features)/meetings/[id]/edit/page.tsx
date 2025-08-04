// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { MeetingForm } from "@/app/(protected)/(features)/meetings/components/meeting-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/core/auth";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

interface EditMeetingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit Meeting",
};

export default async function EditMeetingPage({ params }: EditMeetingPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="meeting:update"
      unauthorizedTitle="Access Denied to Edit Meeting"
      unauthorizedDescription="You don't have permission to edit meeting records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton 
              defaultRoute="/meetings"
              defaultLabel="Back to Meetings"
              entityName="Meeting"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Edit Meeting</h1>
              <p className="text-sm text-gray-600 mt-1">Update the information for this meeting</p>
            </div>
          </div>
          
          <MeetingForm id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
