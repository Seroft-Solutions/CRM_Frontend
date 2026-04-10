import { NextRequest, NextResponse } from 'next/server';
import { SPRING_API_URL } from '@/core/api/config/constants';
import { getErrorMessage, getErrorStatus, getVerifiedKeycloakOrganizationId } from '../_helpers';

export async function POST(request: NextRequest) {
  try {
    const { accessToken, selectedOrganizationId } =
      await getVerifiedKeycloakOrganizationId(request);
    const formData = await request.formData();
    const file = formData.get('file');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'Logo file is required' }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'File cannot be empty' }, { status: 400 });
    }

    const springFormData = new FormData();

    springFormData.append('file', file);

    const response = await fetch(
      `${SPRING_API_URL}/api/organization-settings/keycloak/${encodeURIComponent(selectedOrganizationId)}/logo`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: springFormData,
      }
    );

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: payload.message || payload.error || 'Failed to upload organization logo' },
        { status: response.status }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to upload organization logo') },
      { status: getErrorStatus(error) }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { accessToken, selectedOrganizationId } =
      await getVerifiedKeycloakOrganizationId(request);

    const response = await fetch(
      `${SPRING_API_URL}/api/organization-settings/keycloak/${encodeURIComponent(selectedOrganizationId)}/logo`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: payload.message || payload.error || 'Failed to remove organization logo' },
        { status: response.status }
      );
    }

    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to remove organization logo') },
      { status: getErrorStatus(error) }
    );
  }
}
