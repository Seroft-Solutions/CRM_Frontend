export function formatDateTime(value?: string | null): string {
  if (!value) return 'N/A';
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return 'N/A';

  return parsed.toLocaleString();
}

export function formatDurationFromMinutes(totalMinutes?: number | null): string {
  if (
    totalMinutes === undefined ||
    totalMinutes === null ||
    !Number.isFinite(totalMinutes) ||
    totalMinutes <= 0
  ) {
    return '0h 0m';
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.round(totalMinutes % 60);

  return `${hours}h ${minutes}m`;
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
