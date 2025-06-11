'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, CheckCircle, RefreshCw } from 'lucide-react';

interface DiagnosticData {
  timestamp: string;
  session: any;
  cookies: Record<string, string>;
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  url: string;
  userAgent: string;
  environment: Record<string, string>;
  errors: string[];
}

export default function AuthDiagnostics() {
  const { data: session, status } = useSession();
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticData | null>(null);
  const [copied, setCopied] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const collectDiagnosticData = () => {
    console.log('[AUTH][DIAGNOSTICS] Collecting diagnostic data');
    
    const data: DiagnosticData = {
      timestamp: new Date().toISOString(),
      session: session ? {
        user: session.user,
        expires: session.expires,
        hasAccessToken: !!session.access_token,
        hasRefreshToken: !!session.refresh_token
      } : null,
      cookies: {},
      localStorage: {},
      sessionStorage: {},
      url: window.location.href,
      userAgent: navigator.userAgent,
      environment: {
        AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL || 'Not set',
        KEYCLOAK_ISSUER: process.env.NEXT_PUBLIC_AUTH_KEYCLOAK_ISSUER || 'Not set (this is expected)',
        API_URL: process.env.NEXT_PUBLIC_SPRING_API_URL || 'Not set'
      },
      errors: [...errors]
    };

    // Collect cookies
    try {
      document.cookie.split(';').forEach(cookie => {
        const [name, value] = cookie.trim().split('=');
        if (name) {
          data.cookies[name] = value || '';
        }
      });
    } catch (error) {
      data.errors.push(`Cookie collection error: ${error}`);
    }

    // Collect localStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data.localStorage[key] = localStorage.getItem(key) || '';
        }
      }
    } catch (error) {
      data.errors.push(`LocalStorage collection error: ${error}`);
    }

    // Collect sessionStorage
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          data.sessionStorage[key] = sessionStorage.getItem(key) || '';
        }
      }
    } catch (error) {
      data.errors.push(`SessionStorage collection error: ${error}`);
    }

    setDiagnosticData(data);
    console.log('[AUTH][DIAGNOSTICS] Diagnostic data collected', data);
  };

  const copyDiagnosticData = async () => {
    if (!diagnosticData) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnosticData, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      console.log('[AUTH][DIAGNOSTICS] Diagnostic data copied to clipboard');
    } catch (err) {
      console.error('[AUTH][DIAGNOSTICS] Failed to copy diagnostic data', err);
      setErrors(prev => [...prev, `Copy error: ${err}`]);
    }
  };

  // Log session changes
  useEffect(() => {
    console.log('[AUTH][DIAGNOSTICS] Session status changed', { status, session });
  }, [session, status]);

  // Collect initial data on mount
  useEffect(() => {
    collectDiagnosticData();
  }, [session, status]);

  // Listen for authentication errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message.includes('auth') || event.message.includes('keycloak')) {
        const errorMsg = `${event.message} at ${event.filename}:${event.lineno}`;
        setErrors(prev => [...prev, errorMsg]);
        console.error('[AUTH][DIAGNOSTICS] Auth-related error detected', event);
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'authenticated': return 'bg-green-100 text-green-800';
      case 'unauthenticated': return 'bg-red-100 text-red-800';
      case 'loading': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Authentication Diagnostics
          <Badge className={getStatusColor(status)}>
            {status}
          </Badge>
        </CardTitle>
        <CardDescription>
          Diagnostic information for debugging authentication issues. Remove this component in production.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={collectDiagnosticData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
          <Button 
            onClick={copyDiagnosticData} 
            variant="outline" 
            size="sm"
            disabled={!diagnosticData}
          >
            {copied ? (
              <CheckCircle className="h-4 w-4 mr-2" />
            ) : (
              <Copy className="h-4 w-4 mr-2" />
            )}
            {copied ? 'Copied!' : 'Copy All Data'}
          </Button>
        </div>

        {errors.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <h4 className="font-medium text-red-800 mb-2">Recent Errors:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="font-mono">{error}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Session Information */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Session</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-48">
                {JSON.stringify(diagnosticData?.session, null, 2)}
              </pre>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Auth Cookies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-48">
                {Object.entries(diagnosticData?.cookies || {})
                  .filter(([key]) => key.includes('auth') || key.includes('session') || key.includes('token'))
                  .map(([key, value]) => (
                    <div key={key} className="mb-1">
                      <strong>{key}:</strong> {value.substring(0, 50)}{value.length > 50 ? '...' : ''}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Local Storage */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Local Storage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-48">
                {Object.entries(diagnosticData?.localStorage || {}).length > 0 ? (
                  Object.entries(diagnosticData.localStorage).map(([key, value]) => (
                    <div key={key} className="mb-1">
                      <strong>{key}:</strong> {value.substring(0, 50)}{value.length > 50 ? '...' : ''}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">No localStorage data</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Environment */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Environment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-48">
                {Object.entries(diagnosticData?.environment || {}).map(([key, value]) => (
                  <div key={key} className="mb-1">
                    <strong>{key}:</strong> {value}
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t">
                  <strong>Current URL:</strong> {diagnosticData?.url}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Complete Diagnostic Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-96">
              {JSON.stringify(diagnosticData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  );
}