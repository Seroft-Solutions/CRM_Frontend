import { NextRequest, NextResponse } from 'next/server';
import { SPRING_API_URL } from '@/core/api/config/constants';
import { getErrorMessage, getErrorStatus, getVerifiedKeycloakOrganizationId } from './_helpers';

export async function GET(request: NextRequest) {
  try {
    const { accessToken, selectedOrganizationId } =
      await getVerifiedKeycloakOrganizationId(request);

    const response = await fetch(
      `${SPRING_API_URL}/api/organization-settings/keycloak/${encodeURIComponent(selectedOrganizationId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      }
    );

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: payload.message || payload.error || 'Failed to fetch organization settings' },
        { status: response.status }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to fetch organization settings') },
      { status: getErrorStatus(error) }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { accessToken, selectedOrganizationId } =
      await getVerifiedKeycloakOrganizationId(request);
    const body = await request.json();

    const response = await fetch(
      `${SPRING_API_URL}/api/organization-settings/keycloak/${encodeURIComponent(selectedOrganizationId)}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: payload.message || payload.error || 'Failed to update organization settings' },
        { status: response.status }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to update organization settings') },
      { status: getErrorStatus(error) }
    );
  }
}
