/**
 * Public user serializer tests
 *
 * Regression context (2026-11-15):
 * GET /api/users and POST /api/auth returned rows straight from the database
 * (SELECT *), which exposed every user's bcrypt password_hash to any client.
 * The API must never serialize password_hash.
 */
import { toPublicUser } from '../utils/public-user';

describe('toPublicUser', () => {
  const row = {
    id: 7,
    email: 'someone@example.com',
    password_hash: '$2b$10$abcdefghijklmnopqrstuv',
    name: 'Someone',
    is_host: 1,
    role: 'user',
  };

  it('removes password_hash', () => {
    const user = toPublicUser(row);

    expect(user).not.toHaveProperty('password_hash');
  });

  it('keeps the rest of the fields untouched', () => {
    const user = toPublicUser(row);

    expect(user).toMatchObject({
      id: 7,
      email: 'someone@example.com',
      name: 'Someone',
      is_host: 1,
      role: 'user',
    });
  });

  it('does not mutate the original row', () => {
    toPublicUser(row);

    expect(row.password_hash).toBe('$2b$10$abcdefghijklmnopqrstuv');
  });

  it('passes through null and undefined', () => {
    expect(toPublicUser(null)).toBeNull();
    expect(toPublicUser(undefined)).toBeUndefined();
  });
});
