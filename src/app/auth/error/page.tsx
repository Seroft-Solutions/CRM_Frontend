'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');

  // Redirect to login after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  // Map error codes to user-friendly messages
  const getErrorMessage = () => {
    switch (error) {
      case 'RefreshAccessTokenError':
        return 'Your session has expired. Please sign in again.';
      case 'AccessDenied':
        return 'You do not have permission to access this resource.';
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'Verification':
        return 'Unable to verify your authentication.';
      default:
        return 'An unexpected authentication error occurred.';
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold text-red-500">Authentication Error</CardTitle>
          <CardDescription>
            There was a problem with your authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 text-sm bg-red-50 rounded-md border border-red-200">
            <p className="font-medium">{getErrorMessage()}</p>
            <p className="mt-2 text-gray-600">
              You will be redirected to the login page in a few seconds.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={() => router.push('/login')}>
            Go to Login Page
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}