export function formatDateTime(value?: string): string {
  if (!value) return 'N/A';
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return 'N/A';

  return parsed.toLocaleString();
}

export function formatCoordinates(latitude?: number | null, longitude?: number | null): string {
  if (
    latitude === undefined ||
    latitude === null ||
    longitude === undefined ||
    longitude === null ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return 'N/A';
  }

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}
