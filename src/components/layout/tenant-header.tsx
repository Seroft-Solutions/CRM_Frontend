"use client";

import { useAuth } from "@/providers/session-provider";
import { useOrganizationContext } from "@/features/user-management/hooks";
import { Building2, Briefcase } from "lucide-react";

export function TenantHeader() {
  const { session } = useAuth();
  const { organizationName } = useOrganizationContext();

  // Check if user belongs to Business Partners group
  const isBusinessPartner = session?.user?.roles?.includes('/Business Partners') ||
                           session?.user?.groups?.includes('/Business Partners');

  // Only show for business partners
  if (!isBusinessPartner || !organizationName) {
    return null;
  }

  return (
    <div className="container mx-auto mb-6">
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm px-6 py-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-sm font-medium text-gray-600">
                Currently working with
              </div>
              <div className="text-xl font-bold text-blue-900">
                {organizationName}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
            <Briefcase className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">Business Partner</span>
          </div>
        </div>
      </div>
    </div>
  );
}
