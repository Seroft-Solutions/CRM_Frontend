import { NextRequest, NextResponse } from 'next/server';

const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
const DEFAULT_LANGUAGE = 'en';

type NominatimReverseResponse = {
  display_name?: string;
  address?: {
    road?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
  };
};

function parseCoordinate(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) return null;

  return parsed;
}

function buildShortLocationName(data: NominatimReverseResponse): string | null {
  const address = data.address;

  if (!address) return data.display_name || null;

  const area = address.suburb || address.neighbourhood || address.road;
  const city = address.city || address.town || address.village || address.county;
  const state = address.state;
  const country = address.country;

  const parts = [area, city, state, country].filter(Boolean);

  if (parts.length === 0) {
    return data.display_name || null;
  }

  return parts.join(', ');
}

export async function GET(request: NextRequest) {
  const lat = parseCoordinate(request.nextUrl.searchParams.get('lat'));
  const lon = parseCoordinate(request.nextUrl.searchParams.get('lon'));
  const language = request.nextUrl.searchParams.get('lang') || DEFAULT_LANGUAGE;

  if (lat === null || lon === null || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
  }

  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lon),
    zoom: '18',
    addressdetails: '1',
    'accept-language': language,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${NOMINATIM_REVERSE_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'CRM-Frontend/1.0 (reverse geocoding)',
        Accept: 'application/json',
        'Accept-Language': language,
      },
      signal: controller.signal,
      cache: 'force-cache',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Reverse geocoding failed' }, { status: 502 });
    }

    const data = (await response.json()) as NominatimReverseResponse;
    const locationName = buildShortLocationName(data);

    if (!locationName) {
      return NextResponse.json({ error: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        locationName,
        displayName: data.display_name || locationName,
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    );
  } catch {
    return NextResponse.json({ error: 'Unable to resolve location' }, { status: 500 });
  } finally {
    clearTimeout(timeout);
  }
}
