/**
 * Public user serializer.
 *
 * Database rows carry `password_hash` (bcrypt). API responses must never include it,
 * not even to the logged-in user.
 */
export function toPublicUser(user: null): null;
export function toPublicUser(user: undefined): undefined;
export function toPublicUser<T extends Record<string, any>>(user: T): Omit<T, 'password_hash'>;
export function toPublicUser(user: Record<string, any> | null | undefined): any {
  if (!user) return user;

  const { password_hash, ...publicUser } = user;
  void password_hash;

  return publicUser;
}
