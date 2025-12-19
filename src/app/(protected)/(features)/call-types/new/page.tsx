import { CallTypeForm } from '../components/call-type-form';
import { PermissionGuard } from '@/core/auth';
import { Settings } from 'lucide-react';

export const metadata = {
  title: 'Create CallType',
};

export default function CreateCallTypePage() {
  return (
    <PermissionGuard
      requiredPermission="callType:create"
      unauthorizedTitle="Access Denied to Create Call Type"
      unauthorizedDescription="You don't have permission to create new call type records."
    >
      <div className="space-y-6">
        {/* Modern Centered Header for Create Page */}
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-center">
            {/* Left Section: Icon and Title */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
                <Settings className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">Create Call Type</h1>
                <p className="text-sm text-sidebar-foreground/80">Add a new call type classification</p>
              </div>
            </div>

            {/* Center Section: Empty for balance */}
            <div className="flex-1"></div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <CallTypeForm />
        </div>
      </div>
    </PermissionGuard>
  );
}
