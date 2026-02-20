import { SubCallTypeDetails } from '../components/sub-call-type-details';
import { PermissionGuard } from '@/core/auth';
import { Eye, Settings } from 'lucide-react';

interface SubCallTypePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'SubCallType Details',
};

export default async function SubCallTypePage({ params }: SubCallTypePageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard
      requiredPermission="subCallType:read"
      unauthorizedTitle="Access Denied to Sub Call Type Details"
      unauthorizedDescription="You don't have permission to view this sub call type."
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
                <h1 className="text-xl font-semibold text-sidebar-foreground">Sub Call Type Details</h1>
                <p className="text-sm text-sidebar-foreground/80">View sub call type information</p>
              </div>
            </div>

            {/* Center Section: Empty for balance */}
            <div className="flex-1"></div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <SubCallTypeDetails id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
