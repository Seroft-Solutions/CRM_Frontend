export type OfficeDay =
  | 'MONDAY'
  | 'TUESDAY'
  | 'WEDNESDAY'
  | 'THURSDAY'
  | 'FRIDAY'
  | 'SATURDAY'
  | 'SUNDAY';

export interface OrganizationOfficeTimeSlot {
  startTime: string;
  endTime: string;
}

export interface OrganizationOfficeDaySchedule {
  dayOfWeek: OfficeDay;
  timeSlots: OrganizationOfficeTimeSlot[];
}

export interface OrganizationSettings {
  id: number;
  keycloakOrgId: string;
  name: string;
  code?: string | null;
  address?: string | null;
  officeSchedule: OrganizationOfficeDaySchedule[];
}

export async function getOrganizationSettings(): Promise<OrganizationSettings> {
  const response = await fetch('/api/profile/organization-settings', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(errorData.error || 'Failed to fetch organization settings');
  }

  return (await response.json()) as OrganizationSettings;
}

export async function updateOrganizationSettings(
  request: OrganizationSettings
): Promise<OrganizationSettings> {
  const response = await fetch('/api/profile/organization-settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));

    throw new Error(errorData.error || 'Failed to update organization settings');
  }

  return (await response.json()) as OrganizationSettings;
}
