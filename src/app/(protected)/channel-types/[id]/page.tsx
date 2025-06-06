import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

import { ChannelTypeDetails } from "../components/channel-type-details";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/components/auth/permission-guard";

interface ChannelTypePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "ChannelType Details",
};

export default async function ChannelTypePage({ params }: ChannelTypePageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="channelType:read"
      unauthorizedTitle="Access Denied to Channel Type Details"
      unauthorizedDescription="You don't have permission to view this channel type."
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

        <div className="max-w-4xl">
          <PageTitle>Channel Type Details</PageTitle>
          
          <div className="mt-6">
            <ChannelTypeDetails id={id} />
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
