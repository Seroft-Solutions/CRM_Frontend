import { SystemConfigAttributeOptionForm } from '../../components/system-config-attribute-option-form';
import { PermissionGuard } from '@/core/auth';

export const metadata = {
  title: 'Edit Attribute Option',
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditSystemConfigAttributeOptionPage({ params }: PageProps) {
  const { id } = await params;

  return (
    <PermissionGuard
      requiredPermission="systemConfigAttributeOption:update"
      unauthorizedTitle="Access Denied to Edit Attribute Option"
      unauthorizedDescription="You don't have permission to edit attribute option records."
    >
      <div className="space-y-6">
        <div className="feature-header bg-[oklch(0.45_0.06_243)] rounded-lg p-6 shadow-lg relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          ></div>

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center border border-white/30">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>

            <div className="text-white">
              <h1 className="text-2xl font-bold">Edit Attribute Option</h1>
              <p className="text-blue-100">Update the details below</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <SystemConfigAttributeOptionForm id={parseInt(id)} />
        </div>
      </div>
    </PermissionGuard>
  );
}
