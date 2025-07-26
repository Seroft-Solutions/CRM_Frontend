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

import { MeetingDetails } from "../components/meeting-details";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/core/auth";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

interface MeetingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Meeting Details",
};

export default async function MeetingPage({ params }: MeetingPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="meeting:read"
      unauthorizedTitle="Access Denied to Meeting Details"
      unauthorizedDescription="You don't have permission to view this meeting."
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
              <h1 className="text-2xl font-semibold text-gray-900">Meeting Details</h1>
              <p className="text-sm text-gray-600 mt-1">View detailed information for this meeting</p>
            </div>
          </div>
          
          <MeetingDetails id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
