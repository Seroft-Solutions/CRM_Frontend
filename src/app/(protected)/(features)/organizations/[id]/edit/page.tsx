import { OrganizationForm } from '../../components/organization-form';
import { PermissionGuard } from '@/core/auth';
import { Edit, Building } from 'lucide-react';

interface EditOrganizationPageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Edit Organization',
};

export default async function EditOrganizationPage({ params }: EditOrganizationPageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard
      requiredPermission="organization:update"
      unauthorizedTitle="Access Denied to Edit Organization"
      unauthorizedDescription="You don't have permission to edit organization records."
    >
      <div className="space-y-6">
        {/* Modern Centered Header for Edit Page */}
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-center">
            {/* Left Section: Icon and Title */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
                <Edit className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>

              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">Edit Organization</h1>
                <p className="text-sm text-sidebar-foreground/80">Update organization information and details</p>
              </div>
            </div>

            {/* Center Section: Empty for balance */}
            <div className="flex-1"></div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <OrganizationForm id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
