'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { signIn } from 'next-auth/react';
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

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Authentication Error Boundary caught an error:', error, errorInfo);
    
    // Log authentication-specific errors
    if (error.message?.includes('RefreshAccessTokenError') || 
        error.message?.includes('session') || 
        error.message?.includes('token')) {
      console.error('Authentication-related error detected:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  handleSignIn = () => {
    signIn('keycloak');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-600">
                Authentication Error
              </CardTitle>
              <CardDescription className="text-base">
                There was an error with your authentication session. Please try signing in again.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="p-4 text-sm bg-yellow-50 rounded-md border border-yellow-200">
                <p className="font-medium text-yellow-800">
                  Your session may have expired or there was a connection issue.
                </p>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-xs text-gray-500">
                  <summary className="cursor-pointer hover:text-gray-700">
                    Technical Details (Development)
                  </summary>
                  <div className="mt-2 p-2 bg-gray-100 rounded overflow-x-auto">
                    <p className="font-mono">Error: {this.state.error.message}</p>
                    {this.state.error.stack && (
                      <pre className="mt-1 text-xs whitespace-pre-wrap">
                        {this.state.error.stack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
            </CardContent>

            <CardFooter className="flex gap-2">
              <Button onClick={this.handleSignIn} className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Sign In Again
              </Button>
              <Button variant="outline" onClick={this.handleRetry} className="flex-1">
                Try Again
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useAuthErrorHandler() {
  const handleAuthError = (error: Error) => {
    console.error('Authentication error handled by hook:', error);
    
    if (error.message?.includes('RefreshAccessTokenError') || 
        error.message?.includes('session') || 
        error.message?.includes('token')) {
      // Redirect to sign in for auth-related errors
      signIn('keycloak');
    }
  };

  return { handleAuthError };
}