/**
 * CORS origins configuration tests
 *
 * Regression context (2026-11-15):
 * The Render service has CORS_ORIGINS=localhost,127.0.0.1,clubsincronica-backend.onrender.com
 * configured, but server.ts ignored it and used a hardcoded allowlist. Browser requests
 * coming from http://localhost:8081 were rejected with 500 "Not allowed by CORS".
 *
 * These tests lock the contract: the env var is the source of truth, it accepts both
 * bare hostnames (any port) and full origins, and the hardcoded production origins
 * keep working so a missing/empty env var never breaks the deployed app.
 */
import { parseOrigins, getAllowedOrigins, isOriginAllowed } from '../config/cors';

describe('CORS origins', () => {
  describe('parseOrigins', () => {
    it('splits a comma separated list and trims whitespace', () => {
      expect(parseOrigins(' localhost , 127.0.0.1 , clubsincronica-backend.onrender.com ')).toEqual([
        'localhost',
        '127.0.0.1',
        'clubsincronica-backend.onrender.com',
      ]);
    });

    it('ignores empty entries', () => {
      expect(parseOrigins('localhost,,   ,rork.com')).toEqual(['localhost', 'rork.com']);
    });

    it('returns an empty list when the value is missing', () => {
      expect(parseOrigins(undefined)).toEqual([]);
      expect(parseOrigins('')).toEqual([]);
    });
  });

  describe('getAllowedOrigins', () => {
    it('merges CORS_ORIGINS with the production defaults', () => {
      const origins = getAllowedOrigins('localhost,127.0.0.1');

      expect(origins).toContain('localhost');
      expect(origins).toContain('127.0.0.1');
      expect(origins).toContain('https://clubsincronica.app');
      expect(origins).toContain('https://www.clubsincronica.app');
      expect(origins).toContain('https://rork.com');
    });

    it('never loses the production defaults when the env var is absent', () => {
      const origins = getAllowedOrigins(undefined);

      expect(origins).toContain('https://clubsincronica.app');
      expect(origins).toContain('https://rork.com');
    });

    it('does not duplicate entries', () => {
      const origins = getAllowedOrigins('https://rork.com,rork.com');
      const rorkEntries = origins.filter((o: string) => o.includes('rork.com'));

      expect(new Set(rorkEntries).size).toBe(rorkEntries.length);
    });
  });

  describe('isOriginAllowed', () => {
    const allowed = getAllowedOrigins('localhost,127.0.0.1');

    it('allows requests with no Origin header (mobile apps, curl)', () => {
      expect(isOriginAllowed(undefined, allowed)).toBe(true);
    });

    it('allows localhost on any port so Expo web dev server works', () => {
      expect(isOriginAllowed('http://localhost:8081', allowed)).toBe(true);
      expect(isOriginAllowed('http://localhost:19006', allowed)).toBe(true);
      expect(isOriginAllowed('https://localhost:3000', allowed)).toBe(true);
    });

    it('allows 127.0.0.1 on any port', () => {
      expect(isOriginAllowed('http://127.0.0.1:8081', allowed)).toBe(true);
    });

    it('allows the production app origin', () => {
      expect(isOriginAllowed('https://clubsincronica.app', allowed)).toBe(true);
    });

    it('rejects an unrelated origin', () => {
      expect(isOriginAllowed('https://evil.example.com', allowed)).toBe(false);
    });

    it('rejects a lookalike domain that merely contains an allowed host', () => {
      expect(isOriginAllowed('https://localhost.evil.com', allowed)).toBe(false);
    });

    it('matches case-insensitively', () => {
      expect(isOriginAllowed('https://CLUBSINCRONICA.APP', allowed)).toBe(true);
    });
  });
});
