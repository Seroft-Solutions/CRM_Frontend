import { useQuery } from '@tanstack/react-query';
import { formatCoordinates } from './attendance-formatters';

type AttendanceLocationNameProps = {
  latitude?: number | null;
  longitude?: number | null;
};

async function resolveLocationName(latitude: number, longitude: number): Promise<string> {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
    lang: 'en',
  });

  const response = await fetch(`/api/location/reverse?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to resolve location name');
  }

  const data = (await response.json()) as { locationName?: string; displayName?: string };

  return data.locationName || data.displayName || 'Unknown location';
}

export function AttendanceLocationName({ latitude, longitude }: AttendanceLocationNameProps) {
  const hasCoordinates =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const { data, isLoading } = useQuery({
    queryKey: ['attendance-reverse-geocode', latitude, longitude],
    queryFn: () => resolveLocationName(latitude as number, longitude as number),
    enabled: hasCoordinates,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    retry: 1,
  });

  if (!hasCoordinates) {
    return <span>N/A</span>;
  }

  if (isLoading) {
    return <span>Resolving...</span>;
  }

  return (
    <span title={formatCoordinates(latitude, longitude)}>
      {data || formatCoordinates(latitude, longitude)}
    </span>
  );
}
