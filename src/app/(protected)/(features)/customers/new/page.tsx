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

import { CustomerForm } from "../components/customer-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/core/auth";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

export const metadata = {
  title: "Create Customer",
};

export default function CreateCustomerPage() {
  return (
    <PermissionGuard 
      requiredPermission="customer:create"
      unauthorizedTitle="Access Denied to Create Customer"
      unauthorizedDescription="You don't have permission to create new customer records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <ContextAwareBackButton 
              defaultRoute="/customers"
              defaultLabel="Back to Customers"
              entityName="Customer"
            />
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Create Customer</h1>
              <p className="text-sm text-gray-600 mt-1">Enter the details below to create a new customer</p>
            </div>
          </div>
          
          <CustomerForm />
        </div>
      </div>
    </PermissionGuard>
  );
}
