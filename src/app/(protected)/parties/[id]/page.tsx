import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

import { PartyDetails } from "../components/party-details";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";

interface PartyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Party Details",
};

export default async function PartyPage({ params }: PartyPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="party:read"
      unauthorizedTitle="Access Denied to Party Details"
      unauthorizedDescription="You don't have permission to view this party."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/parties">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Parties
              </Link>
            </Button>
          </PageHeader>
        </div>

        <div className="max-w-4xl">
          <PageTitle>Party Details</PageTitle>
          
          <div className="mt-6">
            <PartyDetails id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
