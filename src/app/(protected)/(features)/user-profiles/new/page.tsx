import { UserProfileForm } from '../components/user-profile-form';
import { PermissionGuard } from '@/core/auth';
import { Plus, User } from 'lucide-react';

export const metadata = {
  title: 'Create UserProfile',
};

export default function CreateUserProfilePage() {
  return (
    <PermissionGuard
      requiredPermission="userProfile:create"
      unauthorizedTitle="Access Denied to Create User Profile"
      unauthorizedDescription="You don't have permission to create new user profile records."
    >
      <div className="space-y-6">
        {/* Modern Centered Header for Create Page */}
        <div className="bg-sidebar border border-sidebar-border rounded-md p-4 shadow-sm">
          <div className="flex items-center justify-center">
            {/* Left Section: Icon and Title */}
            <div className="flex items-center gap-3 flex-1">
              <div className="w-8 h-8 bg-sidebar-accent rounded-md flex items-center justify-center shadow-sm">
                <Plus className="w-4 h-4 text-sidebar-accent-foreground" />
              </div>

              <div>
                <h1 className="text-xl font-semibold text-sidebar-foreground">Create New User Profile</h1>
                <p className="text-sm text-sidebar-foreground/80">Add a new user profile to the system</p>
              </div>
            </div>

            {/* Center Section: Empty for balance */}
            <div className="flex-1"></div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <UserProfileForm />
        </div>
      </div>
    </PermissionGuard>
  );
}
