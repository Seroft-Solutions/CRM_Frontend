// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

import { AreaDetails } from "@/app/(protected)/(features)/areas/components/area-details";
import { PageHeader } from "@/components/page-header";
import { PageTitle } from "@/components/page-title";
import { PermissionGuard, InlinePermissionGuard } from "@/core/auth";
import { ContextAwareBackButton } from "@/components/context-aware-back-button";

interface AreaPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: "Area Details",
};

export default async function AreaPage({ params }: AreaPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard 
      requiredPermission="area:read"
      unauthorizedTitle="Access Denied to Area Details"
      unauthorizedDescription="You don't have permission to view this area."
    >
      <div className="space-y-6">
        {/* Professional Header with Dotted Background */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 shadow-lg relative overflow-hidden">
          {/* Dotted background pattern */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}></div>
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center border border-white/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              
              <div className="text-white">
                <h1 className="text-2xl font-bold">Area Details</h1>
                <p className="text-blue-100">View detailed information for this area</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <ContextAwareBackButton 
                defaultRoute="/areas"
                defaultLabel="Back to Areas"
                entityName="Area"
                className="h-8 gap-1.5 border-white/30 bg-white/10 text-white hover:bg-white/20 text-xs backdrop-blur-sm"
              />
              <InlinePermissionGuard requiredPermission="area:update">
                <Button asChild size="sm" className="h-8 gap-1.5 bg-white text-blue-600 hover:bg-blue-50 text-xs font-medium">
                  <Link href={`/areas/${id}/edit`}>
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </Link>
                </Button>
              </InlinePermissionGuard>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <AreaDetails id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
