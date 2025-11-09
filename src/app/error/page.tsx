'use client';

import { AlertCircle } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { signIn } from 'next-auth/react';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (errorCode: string | null) => {
    switch (errorCode) {
      case 'Signin':
        return 'Try signing in with a different account.';
      case 'OAuthSignin':
      case 'OAuthCallback':
      case 'OAuthCreateAccount':
      case 'EmailCreateAccount':
      case 'Callback':
        return 'There was a problem with the authentication service.';
      case 'OAuthAccountNotLinked':
        return 'To confirm your identity, sign in with the same account you used originally.';
      case 'EmailSignin':
        return 'The email could not be sent.';
      case 'CredentialsSignin':
        return 'Sign in failed. Check the details you provided are correct.';
      case 'SessionRequired':
        return 'Please sign in to access this page.';
      default:
        return 'An unexpected error occurred.';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Authentication Error</h2>
          <p className="mt-2 text-center text-lg text-gray-600">
            {error ? getErrorMessage(error) : 'An error occurred during authentication.'}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <Button
            onClick={() => signIn('keycloak', { redirectTo: '/dashboard' })}
            className="w-full"
          >
            Try Again
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = '/')} className="w-full">
            Return to Home
          </Button>
        </div>
      </div>
    </div>
  );
}
