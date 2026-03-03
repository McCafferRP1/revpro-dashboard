/**
 * Session check for middleware. We only verify that a session cookie exists;
 * full signature verification happens in getSession() on the server.
 */

export function hasSessionCookie(cookieHeader: string | null): boolean {
  if (!cookieHeader) return false;
  const match = cookieHeader.match(/revpro_session=([^;]+)/);
  return !!(match && match[1] && match[1].includes("."));
}
