import { UserProfileUpdate } from '@/features/user-profile-management/components/UserProfileUpdate';

export const metadata = {
  title: 'Profile Settings',
  description: 'Manage your profile information and security settings',
};

export default function ProfileSettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl p-6">
      <UserProfileUpdate />
    </div>
  );
}