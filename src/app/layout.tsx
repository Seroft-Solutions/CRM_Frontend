import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { QueryClientProvider } from '@/core';
import { AppSessionProvider } from '@/core/auth';
import { CrossFormNavigationProvider } from '@/context/cross-form-navigation';
import { auth } from '@/auth';

const geistSans = localFont({
  src: './fonts/GeistVF.woff2',
  variable: '--font-geist-sans',
  weight: '100 900',
  fallback: ['system-ui', 'arial'],
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff2',
  variable: '--font-geist-mono',
  weight: '100 900',
  fallback: ['ui-monospace', 'SFMono-Regular', 'monospace'],
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {' '}
        <AppSessionProvider session={session}>
          <QueryClientProvider>
            <CrossFormNavigationProvider>{children}</CrossFormNavigationProvider>
          </QueryClientProvider>
        </AppSessionProvider>
      </body>
    </html>
  );
}
