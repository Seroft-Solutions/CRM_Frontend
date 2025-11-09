import { NextRequest, NextResponse } from 'next/server';
import { keycloakService } from '@/core/api/services/keycloak-service';
import type { OrganizationRepresentation } from '@/core/api/generated/keycloak';
import { getAdminRealmsRealmOrganizationsOrgId } from '@/core/api/generated/keycloak';
import { auth } from '@/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const realm = keycloakService.getRealm();
    if (!realm) {
      throw new Error('Realm configuration missing');
    }

    const { organizationId } = params;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    console.log('=== ORGANIZATION DETAILS API ===');
    console.log('Session User ID (JWT sub):', session.user.id);
    console.log('Organization ID:', organizationId);
    console.log('Realm:', realm);

    const organizationData: OrganizationRepresentation =
      await getAdminRealmsRealmOrganizationsOrgId(realm, organizationId);

    console.log('Organization details from Keycloak:', JSON.stringify(organizationData, null, 2));

    if (!organizationData) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const organization: OrganizationRepresentation = {
      id: organizationData.id || '',
      name: organizationData.name || organizationData.alias || 'Unknown Organization',
      alias: organizationData.alias,
      enabled: organizationData.enabled,
      description: organizationData.description,
      attributes: organizationData.attributes,
      domains: organizationData.domains,
    };

    if (!organization.id || !organization.name) {
      return NextResponse.json({ error: 'Invalid organization data' }, { status: 400 });
    }

    console.log('Processed organization details:', JSON.stringify(organization, null, 2));
    console.log('=== END ORGANIZATION DETAILS API ===');

    return NextResponse.json(organization);
  } catch (error: any) {
    console.error('Organization details GET API error:', error);

    if (error.status === 404) {
      return NextResponse.json(
        {
          error: 'Organization not found',
          organization: null,
        },
        { status: 404 }
      );
    }

    if (error.status === 403) {
      return NextResponse.json(
        { error: 'Access denied. Insufficient permissions.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: error.message || 'Failed to fetch organization details',
        organization: null,
        details: error.code || 'Unknown error',
      },
      { status: error.status || 500 }
    );
  }
}
