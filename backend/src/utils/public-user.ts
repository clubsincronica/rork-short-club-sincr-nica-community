/**
 * Public user serializer.
 *
 * Database rows carry credentials that must never leave the API:
 *  - `password_hash` (bcrypt)
 *  - `mp_access_token` / `mp_refresh_token` (MercadoPago OAuth — payment access)
 *
 * Server-side code reads the MP tokens with direct SQL queries
 * (routes/payments.ts, routes/spaces.ts, routes/oauth-mp.ts), never from
 * API responses, so stripping them here breaks nothing.
 */
const SENSITIVE_FIELDS = ['password_hash', 'mp_access_token', 'mp_refresh_token'] as const;

export function toPublicUser(user: null): null;
export function toPublicUser(user: undefined): undefined;
export function toPublicUser<T extends Record<string, any>>(
  user: T
): Omit<T, (typeof SENSITIVE_FIELDS)[number]>;
export function toPublicUser(user: Record<string, any> | null | undefined): any {
  if (!user) return user;

  const publicUser = { ...user };
  for (const field of SENSITIVE_FIELDS) {
    delete publicUser[field];
  }

  return publicUser;
}
