"use client";

/**
 * AuthProvider component
 *
 * Auth provider that leverages the Orval-generated API clients directly.
 * This is the single source of truth for authentication in the application.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { createTokenService } from '../services/token.service';
import { eventBus, EventNames } from '@/core/common/utils/eventBus';
import { useQueryClient } from '@tanstack/react-query';

// Create token service
const tokenService = createTokenService();

// Create the context type based on the generated types
export interface AuthContextValue {
  user: UserDTO | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequestDTO) => Promise<AuthResponseDTO>;
  logout: () => Promise<void>;
  register: (data: RegisterRequestDTO) => Promise<AuthResponseDTO>;
  refreshAuth: () => Promise<AuthResponseDTO | void>;
}

// Create the auth context
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Hook to use the auth context
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// RBAC context and provider
// Using the RBAC provider from our dedicated module
import { RBACProvider, useRBAC } from '@/core/auth/rbac/context/RBACContext';
import {
  useGetCurrentUser,
  useLogin,
  useLogout, UserDTO,
  useRefreshToken1,
  useRegister
} from '@/core';

// Re-export the RBAC hook for convenience
export { useRBAC };

export interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Auth provider for the application
 *
 * Uses the Orval-generated API functions for authentication operations
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // Define public routes
  const PUBLIC_ROUTES = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/auth/callback',
  ];

  // Determine if current route is public
  const isPublicRoute = PUBLIC_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Use the generated hooks
  const {
    data: currentUser,
    isLoading: isUserLoading,
    error: userError,
    refetch: refetchUser,
  } = useGetCurrentUser({
    query: {
      enabled: !isPublicRoute && isInitialized,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  });

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const logoutMutation = useLogout();
  const refreshTokenMutation = useRefreshToken1();

  // Initialize auth state on mount
  useEffect(() => {
    // Check if we have a token in storage
    const token = tokenService.getToken();
    console.debug('Initial auth check', { hasToken: !!token });
    setIsInitialized(true);
    
    // If we have a token but no user data, force a refresh
    if (token && !currentUser && !isUserLoading) {
      refetchUser();
    }
  }, []);

  // Handle auth-related events
  const handleAuthRedirect = useCallback(() => {
    // Don't redirect if already on a public route
    if (isPublicRoute) return;

    // Handle redirection to login page
    router.push('/login');
  }, [router, isPublicRoute]);

  // Subscribe to auth events
  useEffect(() => {
    // Create subscription to auth events
    const tokenExpiredSub = eventBus.on(EventNames.AUTH.TOKEN_EXPIRED, handleAuthRedirect);
    const unauthorizedSub = eventBus.on(EventNames.AUTH.UNAUTHORIZED, handleAuthRedirect);
    const loginFailureSub = eventBus.on(EventNames.AUTH.LOGIN_FAILURE, handleAuthRedirect);

    // Cleanup subscriptions on unmount
    return () => {
      tokenExpiredSub();
      unauthorizedSub();
      loginFailureSub();
    };
  }, [handleAuthRedirect]);

  // Login function
  const login = async (credentials: LoginRequestDTO): Promise<AuthResponseDTO> => {
    try {
      const response = await loginMutation.mutateAsync({ data: credentials });

      // Store tokens
      if (response.token) {
        tokenService.setToken(response.token);
        console.debug('Token stored after login');
      } else {
        console.error('No token received from login response');
      }
      
      if (response.refreshToken) {
        tokenService.setRefreshToken(response.refreshToken);
        console.debug('Refresh token stored after login');
      } else {
        console.error('No refresh token received from login response');
      }

      // Show success toast
      toast.success('Login successful');

      // Refetch current user
      refetchUser();

      return response;
    } catch (error: any) {
      console.error('Login failed:', error);
      // Show error toast
      toast.error(error?.error || 'Login failed');
      throw error;
    }
  };

  // Register function
  const register = async (data: RegisterRequestDTO): Promise<AuthResponseDTO> => {
    try {
      const response = await registerMutation.mutateAsync({ data });

      // Store tokens
      if (response.token) tokenService.setToken(response.token);
      if (response.refreshToken) tokenService.setRefreshToken(response.refreshToken);

      // Show success toast
      toast.success('Registration successful');

      // Refetch current user
      refetchUser();

      return response;
    } catch (error: any) {
      // Show error toast
      toast.error(error?.error || 'Registration failed');
      throw error;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await logoutMutation.mutateAsync();

      // Clear tokens
      tokenService.clearTokens();

      // Clear all queries
      queryClient.clear();

      // Show success toast
      toast.success('Logged out successfully');

      // Redirect to login
      router.push('/login');
    } catch (error) {
      // Even if API call fails, clear tokens and redirect
      tokenService.clearTokens();
      queryClient.clear();
      router.push('/login');
    }
  };

  // Refresh auth function
  const refreshAuth = async (): Promise<AuthResponseDTO | void> => {
    try {
      const response = await refreshTokenMutation.mutateAsync();

      // Store tokens
      if (response.token) tokenService.setToken(response.token);
      if (response.refreshToken) tokenService.setRefreshToken(response.refreshToken);

      // Refetch current user
      refetchUser();

      return response;
    } catch (error) {
      // If refresh fails, log out
      logout();
    }
  };

  // Determine authentication status
  const isAuthenticated = !!currentUser;

  // Determine loading status
  const isLoading =
    isUserLoading ||
    loginMutation.isPending ||
    registerMutation.isPending ||
    logoutMutation.isPending ||
    refreshTokenMutation.isPending ||
    !isInitialized;

  // Create auth context value
  const authContextValue: AuthContextValue = {
    user: currentUser || null,
    isAuthenticated,
    isLoading,
    error: userError ? String(userError) : null,
    login,
    logout,
    register,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      <RBACProvider user={currentUser}>{children}</RBACProvider>
    </AuthContext.Provider>
  );
};

export default AuthProvider;
