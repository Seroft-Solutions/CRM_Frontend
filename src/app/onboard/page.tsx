'use client';

/**
 * Onboarding Landing Page
 * Magic link destination for new user/partner invitations
 * Validates token → Password setup → Auto-login
 */

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  UserCheck,
  Lock,
} from 'lucide-react';

type OnboardingStep = 'validating' | 'password-setup' | 'logging-in' | 'success' | 'error';

interface UserInfo {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationId: string;
}

export default function OnboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [step, setStep] = useState<OnboardingStep>('validating');
  const [error, setError] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setError('No invitation token provided');
      setStep('error');
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const res = await fetch(`/api/onboard/accept?token=${token}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid or expired invitation token');
      }

      setUserInfo({
        userId: data.result.userId,
        email: data.result.email || '',
        firstName: data.result.firstName,
        lastName: data.result.lastName,
        organizationId: data.result.organizationId,
      });
      setStep('password-setup');
    } catch (err: any) {
      setError(err.message);
      setStep('error');
    }
  };

  const validatePasswordStrength = (pwd: string): string[] => {
    const errors: string[] = [];

    if (pwd.length < 8) {
      errors.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push('One uppercase letter');
    }
    if (!/[a-z]/.test(pwd)) {
      errors.push('One lowercase letter');
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push('One number');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) {
      errors.push('One special character');
    }

    return errors;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setPasswordErrors(validatePasswordStrength(value));
  };

  const handlePasswordSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    const errors = validatePasswordStrength(password);
    if (errors.length > 0) {
      setError('Password does not meet requirements');
      setPasswordErrors(errors);
      return;
    }

    setStep('logging-in');
    setError('');

    try {
      // Step 1: Set password in Keycloak
      const setPasswordRes = await fetch('/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userInfo?.userId,
          password,
        }),
      });

      const setPasswordData = await setPasswordRes.json();

      if (!setPasswordRes.ok) {
        throw new Error(setPasswordData.error || 'Failed to set password');
      }

      // Step 2: Auto-login with Keycloak using the new password
      const result = await signIn('keycloak', {
        redirect: false,
        // NextAuth will handle the OAuth flow with Keycloak
      });

      if (result?.error) {
        throw new Error('Login failed after password setup. Please try logging in manually.');
      }

      setStep('success');

      // Redirect to organization page after a brief success message
      setTimeout(() => {
        router.push('/organization');
      }, 2000);
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message);
      setStep('error');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            {step === 'validating' && <Loader2 className="h-12 w-12 animate-spin text-blue-600" />}
            {step === 'password-setup' && <Lock className="h-12 w-12 text-blue-600" />}
            {step === 'logging-in' && <Loader2 className="h-12 w-12 animate-spin text-blue-600" />}
            {step === 'success' && <CheckCircle className="h-12 w-12 text-green-600" />}
            {step === 'error' && <AlertCircle className="h-12 w-12 text-red-600" />}
          </div>

          <CardTitle className="text-center text-2xl">
            {step === 'validating' && 'Validating Invitation'}
            {step === 'password-setup' && 'Welcome! Set Your Password'}
            {step === 'logging-in' && 'Setting Up Your Account'}
            {step === 'success' && 'Welcome Aboard!'}
            {step === 'error' && 'Oops! Something Went Wrong'}
          </CardTitle>

          <CardDescription className="text-center">
            {step === 'validating' && 'Please wait while we verify your invitation...'}
            {step === 'password-setup' && 'Create a secure password to access your account'}
            {step === 'logging-in' && 'Finalizing your account setup...'}
            {step === 'success' && 'Your account is ready. Redirecting...'}
            {step === 'error' && 'We encountered an issue with your invitation'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Validating State */}
          {step === 'validating' && (
            <div className="flex flex-col items-center space-y-4 py-8">
              <div className="text-sm text-muted-foreground">
                Verifying your invitation token...
              </div>
            </div>
          )}

          {/* Password Setup Form */}
          {step === 'password-setup' && userInfo && (
            <form onSubmit={handlePasswordSetup} className="space-y-6">
              {/* User Info Display */}
              <div className="rounded-lg border bg-blue-50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
                  <UserCheck className="h-4 w-4" />
                  <span>Account Information</span>
                </div>
                <div className="text-sm text-blue-800">
                  <strong>Name:</strong> {userInfo.firstName} {userInfo.lastName}
                </div>
                <div className="text-sm text-blue-800">
                  <strong>Email:</strong> {userInfo.email}
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Enter your password"
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Password Requirements */}
              <div className="rounded-lg border bg-gray-50 p-4">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Password Requirements:
                </div>
                <ul className="text-xs text-gray-600 space-y-1">
                  {passwordErrors.length > 0 ? (
                    passwordErrors.map((err, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-3 w-3" />
                        {err}
                      </li>
                    ))
                  ) : (
                    <>
                      <li className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        At least 8 characters
                      </li>
                      <li className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        One uppercase letter
                      </li>
                      <li className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        One lowercase letter
                      </li>
                      <li className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        One number
                      </li>
                      <li className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        One special character
                      </li>
                    </>
                  )}
                </ul>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={!password || !confirmPassword || passwordErrors.length > 0}
              >
                Set Password & Continue
              </Button>
            </form>
          )}

          {/* Logging In State */}
          {step === 'logging-in' && (
            <div className="flex flex-col items-center space-y-4 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <div className="text-sm text-muted-foreground text-center">
                Setting your password and logging you in...
                <br />
                This will only take a moment.
              </div>
            </div>
          )}

          {/* Success State */}
          {step === 'success' && (
            <div className="flex flex-col items-center space-y-4 py-8">
              <CheckCircle className="h-16 w-16 text-green-600" />
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-green-900">
                  Account Setup Complete!
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirecting you to your dashboard...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {step === 'error' && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Invitation Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>

              <div className="text-sm text-muted-foreground space-y-2">
                <p>This could happen if:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>The invitation link has expired (24 hours)</li>
                  <li>The invitation has already been used</li>
                  <li>The link was not copied correctly</li>
                </ul>
                <p className="pt-2">
                  Please contact your administrator for a new invitation.
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push('/')}
              >
                Go to Login Page
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
