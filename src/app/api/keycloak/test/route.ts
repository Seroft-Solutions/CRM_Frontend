/**
 * Keycloak Admin Test API Route
 * Helps debug authentication and configuration issues
 */

import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';

export async function GET(request: NextRequest) {
  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      configuration: {
        baseUrl: process.env.AUTH_KEYCLOAK_ISSUER?.replace('/realms/crm', '') || 'http://localhost:9080',
        realm: keycloakService.getRealm(),
        adminPath: keycloakService.getAdminPath(),
        hasAdminUsername: !!process.env.KEYCLOAK_ADMIN_USERNAME,
        hasAdminPassword: !!process.env.KEYCLOAK_ADMIN_PASSWORD,
        hasClientId: !!process.env.AUTH_KEYCLOAK_ID,
        hasClientSecret: !!process.env.AUTH_KEYCLOAK_SECRET,
        adminUsername: process.env.KEYCLOAK_ADMIN_USERNAME || 'NOT SET',
        clientId: process.env.AUTH_KEYCLOAK_ID || 'NOT SET',
      },
      debugInfo: keycloakService.getDebugInfo(),
      tests: {
        adminAuth: { success: false, error: '', details: {} },
        connectivity: { success: false, error: '' },
        permissions: { authorized: false, error: '' },
      },
      keycloakEndpoints: {
        adminTokenUrl: `${process.env.AUTH_KEYCLOAK_ISSUER?.replace('/realms/crm', '') || 'http://localhost:9080'}/realms/master/protocol/openid-connect/token`,
        adminApiUrl: `${process.env.AUTH_KEYCLOAK_ISSUER?.replace('/realms/crm', '') || 'http://localhost:9080'}/admin/realms/crm`,
      }
    };

    // Test 1: Admin Authentication
    try {
      const authResult = await keycloakService.testAdminAuth();
      testResults.tests.adminAuth = {
        ...authResult,
        details: {
          tokenCached: keycloakService.getDebugInfo().hasAdminToken,
          tokenValid: keycloakService.getDebugInfo().isAdminTokenValid,
        }
      };
    } catch (error: any) {
      testResults.tests.adminAuth = { 
        success: false, 
        error: error.message,
        details: {
          tokenCached: false,
          tokenValid: false,
        }
      };
    }

    // Test 2: Connectivity (only if auth succeeds)
    if (testResults.tests.adminAuth.success) {
      try {
        const connectivity = await keycloakService.checkAdminConnectivity();
        testResults.tests.connectivity = { 
          success: connectivity, 
          error: connectivity ? '' : 'Connection failed' 
        };
      } catch (error: any) {
        testResults.tests.connectivity = { success: false, error: error.message };
      }
    } else {
      testResults.tests.connectivity = { 
        success: false, 
        error: 'Skipped - authentication failed' 
      };
    }

    // Test 3: Permission Check
    try {
      const permissionCheck = await keycloakService.verifyAdminPermissions();
      testResults.tests.permissions = permissionCheck;
    } catch (error: any) {
      testResults.tests.permissions = { authorized: false, error: error.message };
    }

    // Test 4: Basic Keycloak Connectivity
    try {
      const keycloakHealthUrl = `${process.env.AUTH_KEYCLOAK_ISSUER?.replace('/realms/crm', '') || 'http://localhost:9080'}/health`;
      const healthResponse = await fetch(keycloakHealthUrl, { method: 'GET' });
      testResults.keycloakHealth = {
        url: keycloakHealthUrl,
        status: healthResponse.status,
        ok: healthResponse.ok,
      };
    } catch (error: any) {
      testResults.keycloakHealth = {
        error: error.message,
        message: 'Failed to connect to Keycloak health endpoint'
      };
    }

    return NextResponse.json(testResults, { status: 200 });
  } catch (error: any) {
    console.error('Test API error:', error);
    return NextResponse.json(
      { 
        error: 'Test endpoint failed',
        details: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
