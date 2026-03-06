export interface Session {
  userId: string;
  token: string;
  expiresAt: Date;
}

export function createSession(userId: string): Session {
  return {
    userId,
    token: Math.random().toString(36).slice(2),
    expiresAt: new Date(Date.now() + 3600 * 1000),
  };
}

export function isExpired(session: Session): boolean {
  return new Date() > session.expiresAt;
}

export function refreshSession(session: Session, ttlSeconds = 3600): Session {
  return {
    ...session,
    token: Math.random().toString(36).slice(2),
    expiresAt: new Date(Date.now() + ttlSeconds * 1000),
  };
}
