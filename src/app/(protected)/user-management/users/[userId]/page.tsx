import { UserDetails } from '@/features/user-management/components/UserDetails';

interface UserDetailsPageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function UserDetailsPage({ params }: UserDetailsPageProps) {
  const { userId } = await params;
  return <UserDetails userId={userId} />;
}
