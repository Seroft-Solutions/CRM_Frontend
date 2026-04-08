import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = new Set([
  'storage.googleapis.com',
  'storage.cloud.google.com',
  'crmcup.gumlet.io',
]);

function isAllowedHost(hostname: string): boolean {
  return (
    ALLOWED_HOSTS.has(hostname) ||
    hostname.endsWith('.storage.googleapis.com') ||
    hostname.endsWith('.gumlet.io')
  );
}

export async function GET(request: NextRequest) {
  const sourceUrl = request.nextUrl.searchParams.get('url');

  if (!sourceUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid url parameter' }, { status: 400 });
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol) || !isAllowedHost(parsedUrl.hostname)) {
    return NextResponse.json({ error: 'Image host is not allowed' }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Unable to fetch image' }, { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Unable to proxy image' }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
