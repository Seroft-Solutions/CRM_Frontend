// ===============================================================
// 🛑 AUTO-GENERATED FILE – DO NOT EDIT DIRECTLY 🛑
// - Source: code generation pipeline
// - To customize: use ./overrides/[filename].ts or feature-level
//   extensions (e.g., ./src/features/.../extensions/)
// - Direct edits will be overwritten on regeneration
// ===============================================================
import { DistrictDetails } from '../components/district-details';
import { PermissionGuard } from '@/core/auth';
import { Eye, Map } from 'lucide-react';

interface DistrictPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'District Details',
};

export default async function DistrictPage({ params }: DistrictPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard
      requiredPermission="district:read"
      unauthorizedTitle="Access Denied to District Details"
      unauthorizedDescription="You don't have permission to view this district."
    >
      <div className="space-y-6">
        {/* Modern Centered Header for View Page */}
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-center">
            {/* Left Section: Icon and Title */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
                <Eye className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">District Details</h1>
                <p className="text-sm text-sidebar-foreground/80">View district information</p>
              </div>
            </div>

            {/* Center Section: Empty for balance */}
            <div className="flex-1"></div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <DistrictDetails id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
