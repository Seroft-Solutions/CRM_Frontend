const GUMLET_DOMAIN = process.env.NEXT_PUBLIC_GUMLET_DOMAIN || '';
const DEFAULT_GUMLET_DOMAIN = 'crmcup.gumlet.io';
const GCS_HOSTS = new Set(['storage.googleapis.com', 'storage.cloud.google.com']);
const PLACEHOLDER_DOMAINS = new Set(['your-subdomain.gumlet.io', 'gumlet.example.com']);

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const normalizeDomain = (value: string) => {
  if (!value) return '';
  const trimmed = value.replace(/\/+$/, '');
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
};

const normalizeDomainForCheck = (value: string) =>
  value.replace(/^https?:\/\//i, '').replace(/\/+$/, '');

const hasGcsSignature = (url: URL) =>
  url.searchParams.has('GoogleAccessId') ||
  url.searchParams.has('Signature') ||
  url.searchParams.has('X-Goog-Algorithm');

const extractGcsPath = (url: URL): string | null => {
  if (GCS_HOSTS.has(url.hostname)) {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return null;
    return parts.slice(1).join('/');
  }

  if (url.hostname.endsWith('.storage.googleapis.com')) {
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts.length < 1) return null;
    return parts.join('/');
  }

  return null;
};

export const isGumletDomainConfigured = (): boolean => {
  const domain = normalizeDomainForCheck(GUMLET_DOMAIN);
  return Boolean(domain) && !PLACEHOLDER_DOMAINS.has(domain);
};

export const normalizeCatalogImageValue = (value?: string | null): string => {
  if (!value) return '';
  if (value.length <= 500) return value;

  const [base] = value.split('?');
  return base;
};

export const resolveCatalogImageUrl = (value?: string | null): string => {
  if (!value) return '';
  if (isAbsoluteUrl(value)) {
    try {
      const url = new URL(value);
      const gcsPath = extractGcsPath(url);
      if (gcsPath && !hasGcsSignature(url)) {
        const domainToUse = isGumletDomainConfigured() ? GUMLET_DOMAIN : DEFAULT_GUMLET_DOMAIN;
        if (!domainToUse) return value;
        const base = normalizeDomain(domainToUse);
        return `${base}/${gcsPath}`;
      }
    } catch {
      return value;
    }

    return value;
  }
  const domainToUse = isGumletDomainConfigured() ? GUMLET_DOMAIN : DEFAULT_GUMLET_DOMAIN;
  if (!domainToUse) return value;

  const base = normalizeDomain(domainToUse);
  const cleanPath = value.startsWith('/') ? value.slice(1) : value;
  return `${base}/${cleanPath}`;
};
