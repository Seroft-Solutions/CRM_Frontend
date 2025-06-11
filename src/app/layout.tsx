import type { Metadata } from "next";
import "./globals.css";
import { QueryClientProvider } from "@/core";
import { AppSessionProvider } from "@/providers/session-provider";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "CRM Cup - Customer Relationship Management",
  description: "Advanced CRM solution for managing customer relationships",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get the session server-side to avoid client-side loading states
  const session = await auth();

  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AppSessionProvider session={session}>
          <QueryClientProvider>
            {children}
          </QueryClientProvider>
        </AppSessionProvider>
      </body>
    </html>
  );
}
