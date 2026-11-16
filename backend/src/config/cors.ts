/**
 * CORS origin resolution.
 *
 * The allowlist comes from the CORS_ORIGINS environment variable (comma separated),
 * merged with the production origins of the club so an empty/missing variable can
 * never lock the deployed app out of its own API.
 *
 * Entries may be either:
 *  - bare hostnames ("localhost", "127.0.0.1"): any scheme and any port is allowed
 *    (this is what the Expo web dev server needs: http://localhost:8081)
 *  - full origins ("https://clubsincronica.app"): exact match only
 */

const PRODUCTION_DEFAULTS = [
  'https://clubsincronica.app',
  'https://www.clubsincronica.app',
  'https://rork.com',
];

export function parseOrigins(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function getAllowedOrigins(raw: string | undefined = process.env.CORS_ORIGINS): string[] {
  const seen = new Set<string>();
  const origins: string[] = [];

  for (const entry of [...PRODUCTION_DEFAULTS, ...parseOrigins(raw)]) {
    const key = entry.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    origins.push(entry);
  }

  return origins;
}

function normalizeOrigin(origin: string): { host: string; full: string } {
  try {
    const parsed = new URL(origin);
    const full = `${parsed.protocol}//${parsed.host}`.toLowerCase().replace(/\/$/, '');
    return { host: parsed.hostname.toLowerCase(), full };
  } catch {
    const bare = origin.toLowerCase().replace(/\/$/, '');
    return { host: bare, full: bare };
  }
}

export function isOriginAllowed(
  origin: string | undefined | null,
  allowed: string[] = getAllowedOrigins()
): boolean {
  // No Origin header: mobile apps, curl, server-to-server. Nothing to validate.
  if (!origin) return true;

  const { host, full } = normalizeOrigin(origin);

  return allowed.some((entry) => {
    const normalized = entry.toLowerCase().trim().replace(/\/$/, '');
    if (normalized.includes('://')) return normalized === full;
    return normalized === host;
  });
}
