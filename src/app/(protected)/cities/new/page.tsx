import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CityForm } from "../components/city-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

export const metadata = {
  title: "Create City",
};

export default function CreateCityPage() {
  return (
    <PermissionGuard 
      requiredPermission="city:create"
      unauthorizedTitle="Access Denied to Create City"
      unauthorizedDescription="You don't have permission to create new city records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/cities">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Cities
              </Link>
            </Button>
          </PageHeader>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-8 bg-blue-600 rounded-full"></div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Create City</h1>
              <p className="text-sm text-gray-600 mt-1">Enter the details below to create a new city</p>
            </div>
          </div>
          
          <CityForm />
        </div>
      </div>
    </PermissionGuard>
  );
}
