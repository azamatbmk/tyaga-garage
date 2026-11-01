export const SESSION_COOKIE = 'tyaga_session';
export const SESSION_MAX_AGE_SEC = 60 * 60 * 12;

export function sessionCookie(id: string) {
  return `${SESSION_COOKIE}=${id}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_MAX_AGE_SEC}`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

export function readSessionId(cookieHeader: string | undefined) {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    if (trimmed.slice(0, eq) !== SESSION_COOKIE) continue;
    const value = trimmed.slice(eq + 1);
    if (!/^[A-Za-z0-9_-]{20,128}$/.test(value)) return null;
    return value;
  }
  return null;
}
