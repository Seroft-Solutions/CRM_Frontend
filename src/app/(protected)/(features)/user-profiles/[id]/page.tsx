import { UserProfileDetails } from '../components/user-profile-details';
import { PermissionGuard } from '@/core/auth';
import { Eye, User } from 'lucide-react';

interface UserProfilePageProps {
  params: Promise<{
    id: string;
  }>;
}

export const metadata = {
  title: 'UserProfile Details',
};

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { id: idParam } = await params;
  const id = parseInt(idParam, 10);

  return (
    <PermissionGuard
      requiredPermission="userProfile:read"
      unauthorizedTitle="Access Denied to User Profile Details"
      unauthorizedDescription="You don't have permission to view this user profile."
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
                <h1 className="text-xl font-semibold text-sidebar-foreground">User Profile Details</h1>
                <p className="text-sm text-sidebar-foreground/80">View user information and settings</p>
              </div>
            </div>

            {/* Center Section: Empty for balance */}
            <div className="flex-1"></div>

            {/* Right Section: Spacer for balance */}
            <div className="flex-1"></div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <UserProfileDetails id={id} />
        </div>
      </div>
    </PermissionGuard>
  );
}
