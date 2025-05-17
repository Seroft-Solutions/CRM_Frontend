'use client';

/**
 * RegisterForm component
 *
 * A form for registering new users with improved UI using shadcn components.
 */
import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../hooks';
import {
  useRegister,
  RegisterRequestDTO,
} from '@/core';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export interface RegisterFormProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  className?: string;
  redirectUrl?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onError,
  className = '',
  redirectUrl,
}) => {
  const { error: authError } = useAuth();
  const registerMutation = useRegister();
  const isRegistering = registerMutation.isPending;

  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Form state
  const [formData, setFormData] = useState<RegisterRequestDTO & { confirmPassword: string }>({
    name: '',
    businessName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    try {
      // Validate form
      if (!formData.email) {
        throw new Error('Email is required');
      }

      if (!formData.password) {
        throw new Error('Password is required');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (!agreeTerms) {
        throw new Error('You must agree to the terms and conditions');
      }

      // Create registration data
      const registerData: RegisterRequestDTO = {
        name: formData.name,
        businessName: formData.businessName,
        email: formData.email,
        password: formData.password,
      };

      // Attempt registration using the generated API mutation
      await registerMutation.mutateAsync({ data: registerData });

      // Success callback
      if (onSuccess) {
        onSuccess();
      }

      // Redirect if successful (default to dashboard)
      if (redirectUrl && typeof window !== 'undefined') {
        window.location.href = redirectUrl;
      } else if (typeof window !== 'undefined') {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
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
            <UserPlus className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
            Join Our Community
          </CardTitle>
          <CardDescription className="text-center">
            Create your account and start managing content
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

            {/* Name fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-blue-700 dark:text-blue-300"
                >
                  Name
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-muted-foreground"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-9 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* Business Name field */}
              <div className="space-y-2">
                <Label
                  htmlFor="businessName"
                  className="text-sm font-medium text-blue-700 dark:text-blue-300"
                >
                  Organization Name
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      className="h-4 w-4 text-muted-foreground"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                      <path
                        fillRule="evenodd"
                        d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 010 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <Input
                    id="businessName"
                    name="businessName"
                    placeholder="New Business"
                    required
                    value={formData.businessName}
                    onChange={handleChange}
                    className="pl-9 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>
            </div>

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
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Confirm Password field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Terms and conditions */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={agreeTerms}
                onCheckedChange={checked => setAgreeTerms(checked === true)}
              />
              {/*<div className="grid gap-1.5 leading-none">*/}
              {/*  <Label*/}
              {/*      htmlFor="terms"*/}
              {/*      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"*/}
              {/*  >*/}
              {/*    I agree to the{' '}*/}
              {/*    <Link*/}
              {/*        href="/terms"*/}
              {/*        className="font-medium text-primary hover:text-primary/80"*/}
              {/*    >*/}
              {/*      terms and conditions*/}
              {/*    </Link>*/}
              {/*  </Label>*/}
              {/*</div>*/}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col">
            <Button
              type="submit"
              className="w-full relative overflow-hidden group shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-primary/30"
              disabled={isRegistering || !agreeTerms}
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-opacity duration-300 group-hover:opacity-90"></span>
              {isRegistering ? (
                <span className="flex items-center relative z-10">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center justify-center relative z-10">
                  <UserPlus className="mr-2 h-4 w-4" /> Create account
                </span>
              )}
            </Button>

            <div className="mt-6 relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-blue-100 dark:border-blue-800"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-card text-muted-foreground">Account benefits</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-muted-foreground">
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 mr-1 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Content publishing</span>
              </div>
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 mr-1 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Media management</span>
              </div>
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 mr-1 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Analytics access</span>
              </div>
              <div className="flex items-center">
                <svg
                  className="h-4 w-4 mr-1 text-primary"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Collaboration tools</span>
              </div>
            </div>

            <div className="mt-6 text-center text-sm">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-primary hover:text-primary/80 transition-colors duration-200"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
