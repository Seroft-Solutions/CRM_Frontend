'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Copy, CheckCircle } from 'lucide-react';
import { signIn } from 'next-auth/react';
import { useState } from 'react';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const errorCode = searchParams.get('code');
  const state = searchParams.get('state');
  const [copied, setCopied] = useState(false);

  // Log error details for debugging
  useEffect(() => {
    console.error('[AUTH][ERROR_PAGE] Authentication error occurred', {
      error,
      errorDescription,
      errorCode,
      state,
      fullUrl: window.location.href,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
  }, [error, errorDescription, errorCode, state]);

  // Auto-redirect to login after 10 seconds for certain errors
  useEffect(() => {
    if (error === 'RefreshAccessTokenError') {
      const timer = setTimeout(() => {
        console.log('[AUTH][ERROR_PAGE] Auto-redirecting to sign in after session expiry');
        signIn('keycloak');
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  // Copy error details to clipboard
  const copyErrorDetails = async () => {
    const errorDetails = {
      error,
      errorDescription,
      errorCode,
      state,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      console.log('[AUTH][ERROR_PAGE] Error details copied to clipboard');
    } catch (err) {
      console.error('[AUTH][ERROR_PAGE] Failed to copy error details', err);
    }
  };

  // Map error codes to user-friendly messages
  const getErrorDetails = () => {
    switch (error) {
      case 'RefreshAccessTokenError':
        return {
          title: 'Session Expired',
          message: 'Your session has expired. Please sign in again.',
          action: 'Sign In Again',
          autoRedirect: true,
          severity: 'warning',
        };
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          message: 'You do not have permission to access this application. Please contact your administrator.',
          action: 'Go to Login',
          autoRedirect: false,
          severity: 'error',
        };
      case 'Configuration':
        return {
          title: 'Configuration Error',
          message: 'There is a problem with the authentication configuration. Please contact support.',
          action: 'Go to Login',
          autoRedirect: false,
          severity: 'error',
        };
      case 'Verification':
        return {
          title: 'Verification Failed',
          message: 'Unable to verify your authentication. Please try signing in again.',
          action: 'Try Again',
          autoRedirect: false,
          severity: 'warning',
        };
      case 'OAuthAccountNotLinked':
        return {
          title: 'Account Not Linked',
          message: 'This account is not linked to your profile. Please contact your administrator.',
          action: 'Go to Login',
          autoRedirect: false,
          severity: 'error',
        };
      case 'InvalidCheck':
        return {
          title: 'Authentication Check Failed',
          message: 'The authentication verification failed. This might be due to browser storage issues or network problems.',
          action: 'Try Again',
          autoRedirect: false,
          severity: 'warning',
        };
      case 'OAuthCallbackError':
        return {
          title: 'OAuth Callback Error',
          message: 'There was an error during the authentication callback. Please try signing in again.',
          action: 'Try Again',
          autoRedirect: false,
          severity: 'warning',
        };
      default:
        return {
          title: 'Authentication Error',
          message: 'An unexpected authentication error occurred. Please try again.',
          action: 'Try Again',
          autoRedirect: false,
          severity: 'error',
        };
    }
  };

  const errorDetails = getErrorDetails();

  const handleAction = () => {
    console.log('[AUTH][ERROR_PAGE] User initiated action', { 
      action: errorDetails.action, 
      error 
    });
    
    if (error === 'AccessDenied') {
      router.push('/');
    } else {
      signIn('keycloak');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-red-600';
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case 'warning': return 'bg-yellow-100';
      case 'error': return 'bg-red-100';
      default: return 'bg-red-100';
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${getSeverityBg(errorDetails.severity)}`}>
            <AlertCircle className={`h-6 w-6 ${getSeverityColor(errorDetails.severity)}`} />
          </div>
          <CardTitle className={`text-2xl font-bold ${getSeverityColor(errorDetails.severity)}`}>
            {errorDetails.title}
          </CardTitle>
          <CardDescription className="text-base">
            {errorDetails.message}
          </CardDescription>
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

          {errorDescription && (
            <div className="p-3 text-sm bg-gray-50 rounded-md border">
              <p className="font-medium text-gray-800 mb-1">Error Description:</p>
              <p className="text-gray-600">{errorDescription}</p>
            </div>
          )}
          
          {(error || errorCode || state) && (
            <details className="text-xs text-gray-500">
              <summary className="cursor-pointer hover:text-gray-700 font-medium mb-2">
                Technical Details (Click to expand)
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded border font-mono text-xs space-y-1">
                {error && <p><strong>Error:</strong> {error}</p>}
                {errorCode && <p><strong>Code:</strong> {errorCode}</p>}
                {state && <p><strong>State:</strong> {state}</p>}
                <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
                <p><strong>URL:</strong> {window.location.href}</p>
                
                <div className="mt-2 pt-2 border-t border-gray-300">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyErrorDetails}
                    className="text-xs h-7"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Details
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </details>
          )}

          <div className="p-3 text-sm bg-blue-50 rounded-md border border-blue-200">
            <p className="font-medium text-blue-800 mb-1">Need Help?</p>
            <p className="text-blue-700">
              If this error persists, please contact your system administrator with the technical details above.
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex gap-2">
          <Button onClick={handleAction} className="flex-1">
            {errorDetails.action}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/')}
            className="flex-1"
          >
            Go Home
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}