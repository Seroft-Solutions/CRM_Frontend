import { ToasterProvider } from '@/components/toaster-provider';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <ToasterProvider />
    </>
  );
}
