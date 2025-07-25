import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { OrganizationSetupService } from '@/services/organization/organization-setup.service';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { organizationName, domain } = body;

    if (!organizationName) {
      return NextResponse.json({ error: 'Organization name is required' }, { status: 400 });
    }

    const setupService = new OrganizationSetupService();
    const result = await setupService.setupOrganization({ organizationName, domain }, session);

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'ORGANIZATION_EXISTS') {
      return NextResponse.json({ error: 'Organization already exists' }, { status: 409 });
    }
    console.error('Organization setup API error:', error);
    return NextResponse.json({ error: 'Failed to setup organization' }, { status: 500 });
  }
}
