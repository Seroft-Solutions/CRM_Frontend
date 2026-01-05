'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { startKeycloakSignIn } from '@/core/auth/utils/signin';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');

  useEffect(() => {
    if (error === 'RefreshAccessTokenError') {
      const timer = setTimeout(() => {
        startKeycloakSignIn();
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  const getErrorDetails = () => {
    switch (error) {
      case 'RefreshAccessTokenError':
        return {
          title: 'Session Expired',
          message: 'Your session has expired. Please sign in again.',
          action: 'Sign In Again',
          autoRedirect: true,
        };
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          message:
            'You do not have permission to access this application. Please contact your administrator.',
          action: 'Go to Login',
          autoRedirect: false,
        };
      case 'Configuration':
        return {
          title: 'Configuration Error',
          message:
            'There is a problem with the authentication configuration. Please contact support.',
          action: 'Go to Login',
          autoRedirect: false,
        };
      case 'Verification':
        return {
          title: 'Verification Failed',
          message: 'Unable to verify your authentication. Please try signing in again.',
          action: 'Try Again',
          autoRedirect: false,
        };
      case 'OAuthAccountNotLinked':
        return {
          title: 'Account Not Linked',
          message: 'This account is not linked to your profile. Please contact your administrator.',
          action: 'Go to Login',
          autoRedirect: false,
        };
      default:
        return {
          title: 'Authentication Error',
          message: 'An unexpected authentication error occurred. Please try again.',
          action: 'Try Again',
          autoRedirect: false,
        };
    }
  };

  const errorDetails = getErrorDetails();

  const handleAction = () => {
    if (error === 'AccessDenied') {
      router.push('/');
    } else {
      startKeycloakSignIn();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">{errorDetails.title}</CardTitle>
          <CardDescription className="text-base">{errorDetails.message}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {errorDetails.autoRedirect && (
            <div className="p-4 text-sm bg-blue-50 rounded-md border border-blue-200">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
                <p className="font-medium text-blue-800">
                  Automatically redirecting in 10 seconds...
                </p>
              </div>
            </div>
          )}

          {error && (
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-700">Technical Details</summary>
              <p className="mt-2 p-2 bg-gray-100 rounded">Error Code: {error}</p>
            </details>
          )}
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button onClick={handleAction} className="flex-1">
            {errorDetails.action}
          </Button>
          <Button variant="outline" onClick={() => router.push('/')} className="flex-1">
            Go Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
