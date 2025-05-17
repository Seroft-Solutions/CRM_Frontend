'use client';

/**
 * LoginForm component
 *
 * A form for authenticating users with improved UI using shadcn components.
 */
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../context';
import { LoginRequestDTO } from '@/core';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, LogIn } from 'lucide-react';

export interface LoginFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  redirectUrl?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onError,
  className = '',
  redirectUrl,
}) => {
  // Use auth context for login functionality
  const { login, isLoading, error: authError } = useAuth();

  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [credentials, setCredentials] = useState<LoginRequestDTO & { rememberMe?: boolean }>({
    email: '',
    password: '',
    rememberMe: false,
  });

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    setCredentials(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean) => {
    setCredentials(prev => ({
      ...prev,
      rememberMe: checked,
    }));
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    console.log('Login attempt with:', credentials.email);

    try {
      // Validate form
      if (!credentials.email) {
        throw new Error('Email is required');
      }

      if (!credentials.password) {
        throw new Error('Password is required');
      }

      // Attempt login using the auth hook
      await login(credentials);
      console.log('Login successful');

      // Success callback
      if (onSuccess) {
        onSuccess();
      }

      // Only redirect if explicitly requested with redirectUrl prop
      if (redirectUrl && typeof window !== 'undefined') {
        console.log('Redirecting to:', redirectUrl);
        // Use a short timeout to ensure tokens are properly saved before redirect
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 100);
      }
    } catch (error) {
      console.error('Login form error:', error);

      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setFormError(errorMessage);

      if (onError && error instanceof Error) {
        onError(error);
      }
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen px-4 relative">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-1/3 h-32 bg-gradient-to-r from-blue-400/10 to-blue-600/10 rounded-bl-full"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-32 bg-gradient-to-r from-blue-600/10 to-blue-400/10 rounded-tr-full"></div>

      <Card
        className={`w-full max-w-md ${className} relative overflow-hidden border-blue-100 dark:border-blue-900 shadow-lg`}
      >
        {/* Card background accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>

        <CardHeader className="space-y-1">
          <div className="mx-auto w-12 h-12 mb-2 bg-primary/10 rounded-full flex items-center justify-center">
            <LogIn className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Welcome Back
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Form error */}
            {(formError || authError) && (
              <Alert variant="destructive">
                <AlertDescription>{formError || authError}</AlertDescription>
              </Alert>
            )}

            {/* Email field */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-blue-700 dark:text-blue-300"
              >
                Email
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-muted-foreground"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  autoComplete="email"
                  required
                  value={credentials.email}
                  onChange={handleChange}
                  className="pl-10 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-blue-700 dark:text-blue-300"
                >
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-muted-foreground"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  value={credentials.password}
                  onChange={handleChange}
                  className="pl-10 pr-10 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500 transition-colors duration-200"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember me checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={credentials.rememberMe}
                onCheckedChange={handleCheckboxChange}
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Remember me
              </Label>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col">
            <Button
              type="submit"
              className="w-full relative overflow-hidden group shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-opacity duration-300 group-hover:opacity-90"></span>
              (
              <span className="flex items-center justify-center relative z-10">
                <LogIn className="mr-2 h-4 w-4" /> Sign in
              </span>
              )
            </Button>

            <div className="mt-6 text-center">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-blue-100 dark:border-blue-800"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-card text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <div className="mt-4 flex gap-2 justify-center">
                <Button variant="outline" size="icon" className="w-10 h-10 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M15.545 6.558a9.42 9.42 0 0 1 .139 1.626c0 2.434-.87 4.492-2.384 5.885h.002C11.978 15.292 10.158 16 8 16A8 8 0 1 1 8 0a7.689 7.689 0 0 1 5.352 2.082l-2.284 2.284A4.347 4.347 0 0 0 8 3.166c-2.087 0-3.86 1.408-4.492 3.304a4.792 4.792 0 0 0 0 3.063h.003c.635 1.893 2.405 3.301 4.492 3.301 1.078 0 2.004-.276 2.722-.764h-.003a3.702 3.702 0 0 0 1.599-2.431H8v-3.08h7.545z" />
                  </svg>
                </Button>
                <Button variant="outline" size="icon" className="w-10 h-10 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
                  </svg>
                </Button>
                <Button variant="outline" size="icon" className="w-10 h-10 rounded-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951z" />
                  </svg>
                </Button>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="font-medium text-primary hover:text-primary/80 transition-colors duration-200"
              >
                Create an account
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
