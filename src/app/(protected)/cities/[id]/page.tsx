import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CityDetails } from "../components/city-details";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";

interface CityPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "City Details",
};

export default async function CityPage({ params }: CityPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="city:read"
      unauthorizedTitle="Access Denied to City Details"
      unauthorizedDescription="You don't have permission to view this city."
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

        <div className="max-w-4xl">
          <PageTitle>City Details</PageTitle>
          
          <div className="mt-6">
            <CityDetails id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
