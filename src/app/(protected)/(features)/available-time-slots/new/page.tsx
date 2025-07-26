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

import { AvailableTimeSlotForm } from "../components/available-time-slot-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/core/auth";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

export const metadata = {
  title: "Create AvailableTimeSlot",
};

export default function CreateAvailableTimeSlotPage() {
  return (
    <PermissionGuard 
      requiredPermission="availableTimeSlot:create"
      unauthorizedTitle="Access Denied to Create Available Time Slot"
      unauthorizedDescription="You don't have permission to create new available time slot records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton 
              defaultRoute="/available-time-slots"
              defaultLabel="Back to Available Time Slots"
              entityName="AvailableTimeSlot"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Create Available Time Slot</h1>
              <p className="text-sm text-gray-600 mt-1">Enter the details below to create a new available time slot</p>
            </div>
          </div>
          
          <AvailableTimeSlotForm />
        </div>
      </div>
    </PermissionGuard>
  );
}
