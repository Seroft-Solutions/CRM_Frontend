import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { PartyForm } from "../../components/party-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

interface EditPartyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit Party",
};

export default async function EditPartyPage({ params }: EditPartyPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="party:update"
      unauthorizedTitle="Access Denied to Edit Party"
      unauthorizedDescription="You don't have permission to edit party records."
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

        <div className="max-w-2xl">
          <PageTitle>Edit Party</PageTitle>
          
          <div className="mt-6">
            <PartyForm id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
