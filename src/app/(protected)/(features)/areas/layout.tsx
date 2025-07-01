import { ToasterProvider } from "@/components/toaster-provider";

export default function AreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        {children}
      </main>
      <ToasterProvider />
    </div>
  );
}
