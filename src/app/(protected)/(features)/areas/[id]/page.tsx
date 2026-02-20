import { redirect } from 'next/navigation';
import { AreaDetails } from '../components/area-details';
import { PermissionGuard } from '@/core/auth';
import { Eye, Map } from 'lucide-react';

interface AreaPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Area Details',
};

export default async function AreaPage({ params }: AreaPageProps) {
  const { id: idParam } = await params;

  if (idParam === 'create' || idParam === 'new') {
    redirect('/areas/new');
  }

  const id = parseInt(idParam, 10);

  if (isNaN(id)) {
    redirect('/areas');
  }

  return (
    <PermissionGuard
      requiredPermission="area:read"
      unauthorizedTitle="Access Denied to Area Details"
      unauthorizedDescription="You don't have permission to view this area."
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
                <h1 className="text-xl font-semibold text-sidebar-foreground">Area Details</h1>
                <p className="text-sm text-sidebar-foreground/80">View area information</p>
              </div>
            </div>

            {/* Center Section: Empty for balance */}
            <div className="flex-1"></div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <AreaDetails id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
