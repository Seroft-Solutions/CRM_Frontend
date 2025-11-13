import { RoleForm } from '../components/role-form';
import { PermissionGuard } from '@/core/auth';

export const metadata = {
  title: 'Create Role',
};

export default function CreateRolePage() {
  return (
    <PermissionGuard
      requiredPermission="role:create"
      unauthorizedTitle="Access Denied to Create Role"
      unauthorizedDescription="You don't have permission to create new role records."
    >
      <div className="space-y-6">
        {/* Professional Header with Dotted Background */}
        <div className="feature-header bg-[oklch(0.45_0.06_243)] rounded-lg p-6 shadow-lg relative overflow-hidden">
          {/* Dotted background pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          ></div>

          <div className="flex items-center gap-4 relative z-10">
            {/* Icon */}
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center border border-white/30">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>

            <div className="text-white">
              <h1 className="text-2xl font-bold">Create Role</h1>
              <p className="text-blue-100">Enter the details below to create a new role</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <RoleForm />
        </div>
      </div>
    </PermissionGuard>
  );
}
