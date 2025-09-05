import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { QueryClientProvider } from '@/core';
import { AppSessionProvider } from '@/core/auth';
import { AuthErrorBoundary } from '@/core/auth/components/auth-error-boundary';
import { CrossFormNavigationProvider } from '@/context/cross-form-navigation';
import { auth } from '@/auth';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CRM Cup - Customer Relationship Management',
  description: 'Advanced CRM solution for managing customer relationships',
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <AuthErrorBoundary>
          <AppSessionProvider session={session}>
            <QueryClientProvider>
              <CrossFormNavigationProvider>{children}</CrossFormNavigationProvider>
            </QueryClientProvider>
          </AppSessionProvider>
        </AuthErrorBoundary>
      </body>
    </html>
  );
}
