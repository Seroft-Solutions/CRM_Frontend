'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface ConfigCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'checking';
  message: string;
  details?: string;
  critical: boolean;
}

export default function AuthConfigValidator() {
  const [checks, setChecks] = useState<ConfigCheck[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  const runValidation = async () => {
    setIsValidating(true);
    const newChecks: ConfigCheck[] = [];

    // Check environment variables
    const requiredEnvVars = [
      'AUTH_SECRET',
      'AUTH_URL', 
      'AUTH_KEYCLOAK_ID',
      'AUTH_KEYCLOAK_SECRET',
      'AUTH_KEYCLOAK_ISSUER'
    ];

    requiredEnvVars.forEach(envVar => {
      const value = process.env[`NEXT_PUBLIC_${envVar}`] || 'Not accessible from client';
      newChecks.push({
        name: `Environment Variable: ${envVar}`,
        status: value !== 'Not accessible from client' ? 'warning' : 'warning',
        message: value !== 'Not accessible from client' ? 'Set (client accessible)' : 'Not accessible from client (this is expected for secrets)',
        details: envVar.includes('SECRET') ? 'Hidden for security' : value,
        critical: true
      });
    });

    // Check URL configuration
    const currentUrl = window.location.origin;
    const expectedAuthUrl = process.env.NEXT_PUBLIC_AUTH_URL || process.env.AUTH_URL;
    
    newChecks.push({
      name: 'Current URL vs AUTH_URL',
      status: currentUrl === expectedAuthUrl ? 'pass' : 'warning',
      message: currentUrl === expectedAuthUrl ? 'URLs match' : 'URLs might not match',
      details: `Current: ${currentUrl}, Expected: ${expectedAuthUrl || 'Not set'}`,
      critical: true
    });

    // Test Keycloak connectivity
    const keycloakIssuer = process.env.NEXT_PUBLIC_AUTH_KEYCLOAK_ISSUER;
    if (keycloakIssuer) {
      try {
        const response = await fetch(`${keycloakIssuer}/.well-known/openid_configuration`, {
          method: 'GET',
          mode: 'cors'
        });
        
        if (response.ok) {
          const config = await response.json();
          newChecks.push({
            name: 'Keycloak Connectivity',
            status: 'pass',
            message: 'Keycloak is reachable',
            details: `Issuer: ${config.issuer}`,
            critical: true
          });

          // Check endpoints
          const requiredEndpoints = ['authorization_endpoint', 'token_endpoint', 'userinfo_endpoint'];
          requiredEndpoints.forEach(endpoint => {
            newChecks.push({
              name: `Keycloak ${endpoint}`,
              status: config[endpoint] ? 'pass' : 'fail',
              message: config[endpoint] ? 'Available' : 'Missing',
              details: config[endpoint],
              critical: true
            });
          });
        } else {
          newChecks.push({
            name: 'Keycloak Connectivity',
            status: 'fail',
            message: `HTTP ${response.status}: ${response.statusText}`,
            details: keycloakIssuer,
            critical: true
          });
        }
      } catch (error) {
        newChecks.push({
          name: 'Keycloak Connectivity',
          status: 'fail',
          message: 'Connection failed',
          details: error instanceof Error ? error.message : String(error),
          critical: true
        });
      }
    } else {
      newChecks.push({
        name: 'Keycloak Connectivity',
        status: 'fail',
        message: 'Keycloak issuer not configured',
        critical: true
      });
    }

    // Check browser storage
    try {
      localStorage.setItem('auth-test', 'test');
      localStorage.removeItem('auth-test');
      newChecks.push({
        name: 'Local Storage',
        status: 'pass',
        message: 'Working',
        critical: false
      });
    } catch (error) {
      newChecks.push({
        name: 'Local Storage',
        status: 'fail',
        message: 'Not available',
        details: error instanceof Error ? error.message : String(error),
        critical: false
      });
    }

    try {
      sessionStorage.setItem('auth-test', 'test');
      sessionStorage.removeItem('auth-test');
      newChecks.push({
        name: 'Session Storage',
        status: 'pass',
        message: 'Working',
        critical: false
      });
    } catch (error) {
      newChecks.push({
        name: 'Session Storage',
        status: 'fail',
        message: 'Not available',
        details: error instanceof Error ? error.message : String(error),
        critical: false
      });
    }

    // Check cookies
    const cookieTest = 'auth-test=test; path=/';
    document.cookie = cookieTest;
    const cookiesEnabled = document.cookie.indexOf('auth-test=test') !== -1;
    document.cookie = 'auth-test=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    newChecks.push({
      name: 'Cookies',
      status: cookiesEnabled ? 'pass' : 'fail',
      message: cookiesEnabled ? 'Working' : 'Not working',
      critical: true
    });

    // Check HTTPS in production
    const isHttps = window.location.protocol === 'https:';
    const isProd = process.env.NODE_ENV === 'production';
    
    newChecks.push({
      name: 'HTTPS (Production)',
      status: !isProd || isHttps ? 'pass' : 'fail',
      message: !isProd ? 'Not production' : isHttps ? 'Using HTTPS' : 'Not using HTTPS',
      details: `Protocol: ${window.location.protocol}`,
      critical: isProd
    });

    // Check NextAuth API route
    try {
      const response = await fetch('/api/auth/providers');
      if (response.ok) {
        const providers = await response.json();
        newChecks.push({
          name: 'NextAuth API',
          status: 'pass',
          message: 'API routes working',
          details: `Providers: ${Object.keys(providers).join(', ')}`,
          critical: true
        });
      } else {
        newChecks.push({
          name: 'NextAuth API',
          status: 'fail',
          message: `HTTP ${response.status}`,
          critical: true
        });
      }
    } catch (error) {
      newChecks.push({
        name: 'NextAuth API',
        status: 'fail',
        message: 'API routes not accessible',
        details: error instanceof Error ? error.message : String(error),
        critical: true
      });
    }

    setChecks(newChecks);
    setIsValidating(false);

    // Log results
    console.log('[AUTH][CONFIG_VALIDATOR] Validation completed', {
      totalChecks: newChecks.length,
      passed: newChecks.filter(c => c.status === 'pass').length,
      failed: newChecks.filter(c => c.status === 'fail').length,
      warnings: newChecks.filter(c => c.status === 'warning').length,
      criticalIssues: newChecks.filter(c => c.status === 'fail' && c.critical).length
    });
  };

  useEffect(() => {
    runValidation();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case 'checking': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pass': return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
      case 'fail': return <Badge className="bg-red-100 text-red-800">Fail</Badge>;
      case 'warning': return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'checking': return <Badge className="bg-blue-100 text-blue-800">Checking</Badge>;
    }
  };

  const criticalIssues = checks.filter(c => c.status === 'fail' && c.critical).length;
  const totalIssues = checks.filter(c => c.status === 'fail').length;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Authentication Configuration Validator
          <Button onClick={runValidation} disabled={isValidating} variant="outline" size="sm">
            {isValidating ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Re-validate
          </Button>
        </CardTitle>
        <CardDescription>
          Validates authentication configuration and connectivity. Remove this component in production.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {criticalIssues > 0 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <h4 className="font-medium text-red-800">Critical Issues Detected</h4>
            </div>
            <p className="text-red-700">
              {criticalIssues} critical issue{criticalIssues > 1 ? 's' : ''} found that may prevent authentication from working properly.
            </p>
          </div>
        )}

        <div className="grid gap-3">
          {checks.map((check, index) => (
            <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
              <div className="mt-0.5">
                {getStatusIcon(check.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-sm">{check.name}</h4>
                  {getStatusBadge(check.status)}
                  {check.critical && (
                    <Badge variant="outline" className="text-xs">Critical</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-1">{check.message}</p>
                {check.details && (
                  <p className="text-xs text-gray-500 font-mono bg-gray-50 p-1 rounded">
                    {check.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <div className="text-sm text-gray-600">
            <strong>Summary:</strong> {checks.length} checks completed, {checks.filter(c => c.status === 'pass').length} passed, {totalIssues} failed, {checks.filter(c => c.status === 'warning').length} warnings
          </div>
        </div>
      </CardContent>
    </Card>
  );
}