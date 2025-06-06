import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

import { CallDetails } from "../components/call-details";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";

interface CallPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Call Details",
};

export default async function CallPage({ params }: CallPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="call:read"
      unauthorizedTitle="Access Denied to Call Details"
      unauthorizedDescription="You don't have permission to view this call."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/calls">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Calls
              </Link>
            </Button>
          </PageHeader>
        </div>

        <div className="max-w-4xl">
          <PageTitle>Call Details</PageTitle>
          
          <div className="mt-6">
            <CallDetails id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
