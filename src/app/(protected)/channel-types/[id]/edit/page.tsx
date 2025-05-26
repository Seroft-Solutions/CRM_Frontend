import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { ChannelTypeForm } from "../../components/channel-type-form";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard } from "@/components/auth/permission-guard";

interface EditChannelTypePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Edit ChannelType",
};

export default async function EditChannelTypePage({ params }: EditChannelTypePageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="channelType:update"
      unauthorizedTitle="Access Denied to Edit Channel Type"
      unauthorizedDescription="You don't have permission to edit channel type records."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <PageHeader>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/channel-types">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Channel Types
              </Link>
            </Button>
          </PageHeader>
        </div>

        <div className="max-w-2xl">
          <PageTitle>Edit Channel Type</PageTitle>
          
          <div className="mt-6">
            <ChannelTypeForm id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
