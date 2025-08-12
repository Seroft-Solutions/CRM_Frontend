import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Drafts | CRM Platform',
  description: 'Manage your saved form drafts',
};

export default function DraftsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
