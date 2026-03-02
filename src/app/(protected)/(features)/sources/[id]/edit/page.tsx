import { SourceForm } from '../../components/source-form';
import { PermissionGuard } from '@/core/auth';
import { Edit, MapPin } from 'lucide-react';

interface EditSourcePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'Edit Source',
};

export default async function EditSourcePage({ params }: EditSourcePageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard
      requiredPermission="source:update"
      unauthorizedTitle="Access Denied to Edit Source"
      unauthorizedDescription="You don't have permission to edit source records."
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
                <h1 className="text-xl font-semibold text-sidebar-foreground">Edit Source</h1>
                <p className="text-sm text-sidebar-foreground/80">Update source information</p>
              </div>
            </div>

            {/* Center Section: Empty for balance */}
            <div className="flex-1"></div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <SourceForm id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
