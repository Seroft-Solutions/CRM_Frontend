'use client';

import { useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Coffee, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const { status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const error = searchParams.get('error');

  // Redirect if already authenticated
  useEffect(() => {
    if (status === 'authenticated') {
      router.push(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  // Auto-redirect to Keycloak if no error
  useEffect(() => {
    if (status === 'unauthenticated' && !error) {
      const timer = setTimeout(() => {
        signIn('keycloak', { callbackUrl });
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [status, error, callbackUrl]);

  const handleLogin = () => {
    signIn('keycloak', { callbackUrl });
  };

  // Show error state
  if (error) {
    const getErrorMessage = () => {
      switch (error) {
        case 'RefreshAccessTokenError':
          return 'Your session has expired. Please sign in again.';
        case 'AccessDenied':
          return 'Access denied. You may not have permission to access this application.';
        case 'Configuration':
          return 'There is a configuration problem. Please contact support.';
        default:
          return 'An authentication error occurred. Please try again.';
      }
    };

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-600">Authentication Error</CardTitle>
            <CardDescription>{getErrorMessage()}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleLogin} className="w-full">
              Try Again
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push('/')} 
              className="w-full"
            >
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state
  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Coffee className="mx-auto h-12 w-12 animate-bounce text-blue-600 mb-4" />
          <div className="h-8 w-8 mx-auto animate-spin rounded-full border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600 mb-2">
            {status === 'authenticated' ? 'Welcome back!' : 'Signing you in...'}
          </p>
          <p className="text-sm text-gray-500">
            {status === 'authenticated' ? 'Redirecting to your dashboard' : 'Redirecting to Keycloak'}
          </p>
        </div>
      </div>
    );
  }

  // Manual login option
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Coffee className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-xl">Welcome to CRM Cup</CardTitle>
          <CardDescription>Sign in to access your dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleLogin} className="w-full" size="lg">
            Sign In with Keycloak
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
