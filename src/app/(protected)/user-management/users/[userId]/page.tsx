import { UserDetails } from '@/features/user-management/components/UserDetails';

interface UserDetailsPageProps {
  params: {
    userId: string;
  };
}

export default function UserDetailsPage({ params }: UserDetailsPageProps) {
  return <UserDetails userId={params.userId} />;
}
